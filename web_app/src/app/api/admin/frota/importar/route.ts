import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest, canManageFleet } from '@/utils/auth/session'
import * as XLSX from 'xlsx'

// GET → download template .xlsx
export async function GET() {
  const headers = [
    'placa', 'modelo', 'marca', 'tipo', 'combustivel', 'cor',
    'renavam', 'chassi', 'filial', 'ano_fabricacao', 'ano_modelo',
    'capacidade', 'device_id',
  ]
  const example = [
    'ABC-1234', 'Sprinter', 'Mercedes-Benz', 'Van', 'Diesel', 'Branco',
    '12345678901', 'AAAAA00000AA00000', 'Matriz', '2022', '2023',
    '15', '',
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  XLSX.utils.book_append_sheet(wb, ws, 'Veículos')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_importacao_veiculos.xlsx"',
    },
  })
}

// POST → validate + import rows
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })

  if (!rows.length) {
    return NextResponse.json({ error: 'Planilha vazia.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: tenant } = await supabase.from('tenants').select('id').single()
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 500 })
  }

  // Load existing plates for duplicate check
  const { data: existing } = await supabase
    .from('veiculos')
    .select('placa')
    .is('deleted_at', null)
  const existingPlates = new Set((existing ?? []).map((v: { placa: string }) => v.placa.toUpperCase()))

  const TIPOS_VALIDOS = ['Carro', 'Van', 'Caminhão', 'Moto', 'Outro']
  const COMBUSTIVEIS_VALIDOS = ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'Elétrico', 'Híbrido']

  const validRows: Record<string, unknown>[] = []
  const errors: { row: number; erros: string[] }[] = []

  rows.forEach((row, idx) => {
    const rowNum = idx + 2 // header is row 1
    const erros: string[] = []

    const placa = String(row.placa ?? '').toUpperCase().trim()
    const modelo = String(row.modelo ?? '').trim()
    const marca = String(row.marca ?? '').trim()
    const tipo = String(row.tipo ?? '').trim()
    const combustivel = String(row.combustivel ?? '').trim()
    const cor = String(row.cor ?? '').trim()
    const renavam = String(row.renavam ?? '').replace(/\D/g, '')
    const chassi = String(row.chassi ?? '').toUpperCase().trim()
    const filial = String(row.filial ?? '').trim()
    const ano_fabricacao = String(row.ano_fabricacao ?? '').trim()
    const ano_modelo = String(row.ano_modelo ?? '').trim()
    const capacidade = String(row.capacidade ?? '').trim() || null
    const device_id = String(row.device_id ?? '').trim() || null

    // Validações
    const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
    const antigo = /^[A-Z]{3}[0-9]{4}$/
    const placaNorm = placa.replace('-', '')
    if (!placa) erros.push('Placa obrigatória.')
    else if (!mercosul.test(placaNorm) && !antigo.test(placaNorm)) erros.push(`Placa inválida: "${placa}".`)
    else if (existingPlates.has(placa.replace('-', ''))) erros.push(`Placa "${placa}" já existe.`)

    if (!modelo) erros.push('Modelo obrigatório.')
    if (!marca) erros.push('Marca obrigatória.')
    if (!tipo) erros.push('Tipo obrigatório.')
    else if (!TIPOS_VALIDOS.includes(tipo)) erros.push(`Tipo inválido: "${tipo}". Use: ${TIPOS_VALIDOS.join(', ')}.`)
    if (!combustivel) erros.push('Combustível obrigatório.')
    else if (!COMBUSTIVEIS_VALIDOS.includes(combustivel)) erros.push(`Combustível inválido: "${combustivel}". Use: ${COMBUSTIVEIS_VALIDOS.join(', ')}.`)
    if (!cor) erros.push('Cor obrigatória.')
    if (!renavam) erros.push('RENAVAM obrigatório.')
    else if (renavam.length !== 9 && renavam.length !== 11) erros.push('RENAVAM deve ter 9 ou 11 dígitos.')
    if (!chassi) erros.push('Chassi obrigatório.')
    else if (chassi.length !== 17) erros.push('Chassi deve ter 17 caracteres.')
    if (!filial) erros.push('Filial obrigatória.')
    if (!ano_fabricacao || !/^\d{4}$/.test(ano_fabricacao)) erros.push('Ano de fabricação inválido.')
    if (!ano_modelo || !/^\d{4}$/.test(ano_modelo)) erros.push('Ano do modelo inválido.')

    if (erros.length > 0) {
      errors.push({ row: rowNum, erros })
    } else {
      // Normalize placa to no dash
      const placaFinal = placaNorm
      existingPlates.add(placaFinal) // prevent in-batch duplicates
      validRows.push({
        tenant_id: tenant.id,
        placa: placaFinal,
        modelo, marca, tipo, combustivel, cor,
        renavam,
        chassi,
        filial,
        ano_fabricacao: Number(ano_fabricacao),
        ano_modelo: Number(ano_modelo),
        capacidade: capacidade || null,
        device_id: device_id || null,
        status: 'Ativo',
      })
    }
  })

  // Return validation report without importing if there are errors
  if (errors.length > 0) {
    return NextResponse.json({
      ok: false,
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      errors,
      validRows: validRows.map(r => r.placa),
    })
  }

  // All rows valid — import
  const { error: insertError } = await supabase.from('veiculos').insert(validRows)
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Create empty documents for each new vehicle
  const { data: newVehicles } = await supabase
    .from('veiculos')
    .select('id')
    .in('placa', validRows.map(r => r.placa as string))
    .is('deleted_at', null)

  if (newVehicles && newVehicles.length > 0) {
    const docInserts = newVehicles.flatMap((v: { id: string }) => [
      { veiculo_id: v.id, tenant_id: tenant.id, tipo: 'CRLV' },
      { veiculo_id: v.id, tenant_id: tenant.id, tipo: 'Seguro' },
      { veiculo_id: v.id, tenant_id: tenant.id, tipo: 'Licenciamento' },
    ])
    await supabase.from('veiculo_documentos').insert(docInserts)
  }

  return NextResponse.json({ ok: true, imported: validRows.length })
}

// POST with confirmImport flag → import only valid rows even if some have errors
export async function PUT(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const { validRows: rows, tenantId } = await request.json()
  if (!rows?.length) return NextResponse.json({ error: 'Nenhuma linha válida.' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: tenant } = await supabase.from('tenants').select('id').single()
  if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 500 })

  const toInsert = rows.map((r: Record<string, unknown>) => ({ ...r, tenant_id: tenantId ?? tenant.id }))
  const { error } = await supabase.from('veiculos').insert(toInsert)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: newVehicles } = await supabase
    .from('veiculos')
    .select('id')
    .in('placa', toInsert.map((r: Record<string, unknown>) => r.placa as string))
    .is('deleted_at', null)

  if (newVehicles && newVehicles.length > 0) {
    const docInserts = newVehicles.flatMap((v: { id: string }) => [
      { veiculo_id: v.id, tenant_id: tenant.id, tipo: 'CRLV' },
      { veiculo_id: v.id, tenant_id: tenant.id, tipo: 'Seguro' },
      { veiculo_id: v.id, tenant_id: tenant.id, tipo: 'Licenciamento' },
    ])
    await supabase.from('veiculo_documentos').insert(docInserts)
  }

  return NextResponse.json({ ok: true, imported: toInsert.length })
}
