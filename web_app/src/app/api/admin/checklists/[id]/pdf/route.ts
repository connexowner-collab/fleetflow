import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'
import React from 'react'

// GET /api/admin/checklists/[id]/pdf  → gera e retorna PDF do checklist
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const allowed = ['gestor', 'diretor', 'analista']
  if (!allowed.includes(session.perfil)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 })
  }

  const { id } = await params

  // Buscar checklist + itens + fotos em paralelo
  const [checklistRes, itensRes, fotosRes] = await Promise.all([
    supabase
      .from('checklists')
      .select('id, codigo, codigo_sequencial, motorista_nome, placa, veiculo_nome, km_atual, status, tipo_checklist, unidade, setor, area, observacao, assinatura_base64, cpf_motorista, pdf_url, created_at, assinado_em')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single(),
    supabase.from('checklist_itens').select('nome, conforme').eq('checklist_id', id),
    supabase.from('checklist_fotos').select('tipo, url').eq('checklist_id', id),
  ])

  if (!checklistRes.data) {
    return NextResponse.json({ error: 'Checklist não encontrado.' }, { status: 404 })
  }

  const checklist = checklistRes.data
  const itens = itensRes.data ?? []
  const fotos = fotosRes.data ?? []

  // Se já tem pdf_url salvo, redirecionar diretamente
  if (checklist.pdf_url) {
    return NextResponse.redirect(checklist.pdf_url)
  }

  // Gerar PDF
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { ChecklistPDFDoc } = await import('@/components/pdf/ChecklistPDF')

    const checklistData = {
      id: String(checklist.id),
      codigo_sequencial: String(checklist.codigo_sequencial ?? checklist.codigo ?? ''),
      motorista_nome: String(checklist.motorista_nome ?? ''),
      placa: String(checklist.placa ?? ''),
      veiculo_modelo: String(checklist.veiculo_nome ?? ''),
      km_atual: Number(checklist.km_atual ?? 0),
      status: String(checklist.status ?? ''),
      created_at: String(checklist.created_at ?? new Date().toISOString()),
      tipo: String(checklist.tipo_checklist ?? ''),
      observacoes: String(checklist.observacao ?? ''),
      cpf: String(checklist.cpf_motorista ?? ''),
      unidade: String(checklist.unidade ?? ''),
      setor: String(checklist.setor ?? ''),
      area: String(checklist.area ?? ''),
      assinatura_base64: String(checklist.assinatura_base64 ?? ''),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(ChecklistPDFDoc, { checklist: checklistData, itens, fotos }) as any
    )

    // Salvar no Storage e atualizar pdf_url
    try {
      await supabase.storage.createBucket('fleetflow-docs', { public: true }).catch(() => {})
      const codigo = checklist.codigo_sequencial ?? checklist.codigo ?? id
      const storagePath = `checklists/${profile.tenant_id}/${codigo}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('fleetflow-docs')
        .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('fleetflow-docs').getPublicUrl(storagePath)
        if (urlData?.publicUrl) {
          await supabase.from('checklists').update({ pdf_url: urlData.publicUrl }).eq('id', id)
        }
      }
    } catch { /* falha silenciosa no storage, ainda retorna o PDF */ }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="checklist-${checklist.codigo_sequencial ?? id}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error('[PDF Admin Error]', err)
    return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 })
  }
}
