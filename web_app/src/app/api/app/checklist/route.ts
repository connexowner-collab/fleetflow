import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'
import React from 'react'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, placa_vinculada, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ checklists: [], total: 0 })

  let query = supabase
    .from('checklists')
    .select('id, codigo, codigo_sequencial, placa, veiculo_nome, unidade, setor, area, tipo_checklist, status, tem_avaria, created_at, pdf_url, assinado_em, km_atual', { count: 'exact' })
    .eq('motorista_id', profile.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ checklists: data ?? [], total: count ?? 0, page, limit })
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const adminSupabase = createAdminClient()

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, nome, placa_vinculada, tenant_id')
      .eq('email', session.email)
      .single()

    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    if (!profile.tenant_id) return NextResponse.json({ error: 'Empresa (Tenant) não identificada no seu perfil.' }, { status: 400 })
    if (!profile.placa_vinculada) return NextResponse.json({ error: 'Nenhum veículo vinculado.' }, { status: 400 })

    const { data: veiculo } = await adminSupabase
      .from('veiculos')
      .select('id, placa, modelo, marca, chassi, km_atual')
      .eq('placa', profile.placa_vinculada)
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)
      .single()

    if (!veiculo) return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })

    // Parsear FormData
    const formData = await request.formData()
    const body = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => !(v instanceof File))
    )
    
    console.log('[API Checklist] Iniciando recebimento...')
    
    const fotoFrente = formData.get('foto_frente')
    const fotoTras   = formData.get('foto_tras')
    const fotoEsq    = formData.get('foto_lateral_esq')
    const fotoDir    = formData.get('foto_lateral_dir')

    const files: Array<{ name: string; file: Blob; type: string }> = []
    const fFrente = formData.get('foto_frente')
    const fTras   = formData.get('foto_tras')
    const fEsq    = formData.get('foto_lateral_esq')
    const fDir    = formData.get('foto_lateral_dir')

    if (fFrente instanceof Blob) files.push({ name: 'foto_frente', file: fFrente, type: 'Frente' })
    if (fTras   instanceof Blob) files.push({ name: 'foto_tras',   file: fTras,   type: 'Traseira' })
    if (fEsq    instanceof Blob) files.push({ name: 'foto_lateral_esq', file: fEsq, type: 'Lateral Esquerda' })
    if (fDir    instanceof Blob) files.push({ name: 'foto_lateral_dir', file: fDir, type: 'Lateral Direita' })

    // Coletar fotos de avarias
    const avarias: Array<{ descricao: string; tipo: string; gravidade: string; foto?: File }> = []
    const temAvariaRaw = formData.get('tem_avaria') === 'true'
    if (temAvariaRaw) {
      let i = 0
      while (formData.has(`avaria_${i}_descricao`)) {
        const fotoAvaria = formData.get(`avaria_${i}_foto`)
        avarias.push({
          descricao: String(formData.get(`avaria_${i}_descricao`) ?? ''),
          tipo:      String(formData.get(`avaria_${i}_tipo`)      ?? ''),
          gravidade: String(formData.get(`avaria_${i}_gravidade`) ?? ''),
          foto:      fotoAvaria instanceof File ? fotoAvaria : undefined
        })
        if (fotoAvaria instanceof Blob) {
          files.push({ name: `avaria_${i}`, file: fotoAvaria, type: `Avaria: ${formData.get(`avaria_${i}_tipo`)}` })
        }
        i++
      }
    }

    const kmAtual = parseInt(String(body.km_atual ?? '0'))
    if (kmAtual < (veiculo.km_atual ?? 0)) {
      return NextResponse.json({ error: `KM inválido. Anterior: ${veiculo.km_atual}` }, { status: 400 })
    }

    // Gerar código sequencial
    const { count } = await adminSupabase.from('checklists').select('id', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id)
    const seq = String((count ?? 0) + 1).padStart(5, '0')
    const codigo = `CHK-${seq}`

    // Parsear itens
    let inspecao: Record<string, { conforme: boolean; observacao: string }> = {}
    const itens: Array<{ nome: string; conforme: boolean }> = []
    try {
      const parsed = JSON.parse(String(body.inspecao ?? '{}'))
      inspecao = parsed
      for (const [nome, data] of Object.entries(inspecao)) {
        itens.push({ nome: data.observacao ? `${nome} | ${data.observacao}` : nome, conforme: data.conforme })
      }
    } catch { /* */ }

    const temAvaria = avarias.length > 0
    const temNaoConforme = itens.some(i => !i.conforme)
    const status = temAvaria || temNaoConforme ? 'Com Pendências' : 'Aprovado'
    const emailEnvio = String(body.email_envio ?? body.email ?? session.email)
    const tipoChecklist = String(body.tipo_checklist ?? 'Checklist')

    // Inserir checklist
    const { data: checklist, error: chkErr } = await adminSupabase
      .from('checklists')
      .insert({
        tenant_id: profile.tenant_id,
        codigo,
        codigo_sequencial: seq,
        motorista_id: profile.id,
        motorista_nome: profile.nome,
        veiculo_id: veiculo.id,
        placa: veiculo.placa,
        veiculo_nome: `${veiculo.marca ?? ''} ${veiculo.modelo}`.trim(),
        tipo_checklist: tipoChecklist,
        unidade: String(body.unidade ?? ''),
        setor: String(body.setor ?? ''),
        area: String(body.area ?? ''),
        km_anterior: veiculo.km_atual ?? 0,
        km_atual: kmAtual,
        observacao: String(body.observacao ?? ''),
        status,
        tem_avaria: temAvaria,
        assinatura_base64: String(body.assinatura ?? ''),
        email_envio: emailEnvio,
        cpf_motorista: String(body.cpf ?? ''),
        assinado_em: new Date().toISOString(),
      })
      .select().single()

    if (chkErr) throw new Error(`Erro ao salvar checklist: ${chkErr.message}`)

    // Itens
    if (itens.length > 0 || avarias.length > 0) {
      const allItens = [
        ...itens.map(i => ({ checklist_id: checklist.id, nome: i.nome, conforme: i.conforme })),
        ...avarias.map(a => ({ checklist_id: checklist.id, nome: `!!AVARIA!!|${a.tipo}|${a.gravidade}|${a.descricao}`, conforme: false }))
      ]
      await adminSupabase.from('checklist_itens').insert(allItens)
    }

    // Fotos
    const fotosFinal: Array<{ tipo: string; url: string }> = []
    if (files.length > 0) {
      await adminSupabase.storage.createBucket('fleetflow-docs', { public: true }).catch(() => {})
      for (const item of files) {
        try {
          // Blobs não têm .name, Files têm. Pegamos a extensão do tipo MIME ou padrão jpg.
          const mimeExt = item.file.type.split('/')[1] || 'jpg'
          const fileName = `${Date.now()}_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.${mimeExt}`
          // Caminho simplificado
          const path = `${checklist.id}/${fileName}`
          
          console.log(`[Upload] Tentando: ${path}`)
          
          const { error: upErr } = await adminSupabase.storage
            .from('fleetflow-docs')
            .upload(path, item.file, { 
              contentType: item.file.type,
              upsert: true 
            })
          
          if (upErr) {
            console.error(`[Storage Error] ${item.name}:`, upErr)
            continue
          }

          const { data: urlData } = adminSupabase.storage.from('fleetflow-docs').getPublicUrl(path)
          const publicUrl = urlData?.publicUrl
          
          if (publicUrl) {
            const { error: insErr } = await adminSupabase.from('checklist_fotos').insert({ 
              checklist_id: checklist.id, 
              tipo: item.type, 
              url: publicUrl 
            })
            if (insErr) console.error(`[DB Foto Error] ${item.name}:`, insErr)
            else fotosFinal.push({ tipo: item.type, url: publicUrl })
          }
        } catch (err) {
          console.error('[Upload Catch]', err)
        }
      }
    }

    // 4. Assinatura como Imagem no Storage
    if (body.assinatura && String(body.assinatura).startsWith('data:image')) {
      try {
        const base64Data = String(body.assinatura).replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `assinatura_${Date.now()}.png`
        const path = `${checklist.id}/${fileName}`

        const { error: signErr } = await adminSupabase.storage
          .from('fleetflow-docs')
          .upload(path, buffer, { contentType: 'image/png', upsert: true })

        if (!signErr) {
          const { data: urlData } = adminSupabase.storage.from('fleetflow-docs').getPublicUrl(path)
          if (urlData?.publicUrl) {
            // Adicionar assinatura à galeria de fotos
            await adminSupabase.from('checklist_fotos').insert({
              checklist_id: checklist.id,
              tipo: 'Assinatura',
              url: urlData.publicUrl
            })
            fotosFinal.push({ tipo: 'Assinatura', url: urlData.publicUrl })
            console.log('[Signature] Salva como imagem:', urlData.publicUrl)
          }
        }
      } catch (err) {
        console.error('[Signature Error]', err)
      }
    }

    // KM
    await adminSupabase.from('veiculos').update({ km_atual: kmAtual }).eq('id', veiculo.id)

    // PDF e E-mail (Reativar de forma segura)
    setTimeout(() => {
      gerarPDFEEnviarEmail({
        checklist, itens, fotos: fotosFinal, emailEnvio, codigo, placa: veiculo.placa, supabase: adminSupabase, tenantId: profile.tenant_id,
      }).catch(err => console.error('[Background Task Error]', err))
    }, 500);

    return NextResponse.json({ success: true, id: checklist.id, codigo })
  } catch (err: any) {
    console.error('[API POST Error]', err)
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}

async function gerarPDFEEnviarEmail({
  checklist,
  itens,
  fotos,
  emailEnvio,
  codigo,
  placa,
  supabase,
  tenantId,
}: {
  checklist: Record<string, unknown>
  itens: Array<{ nome: string; conforme: boolean }>
  fotos: Array<{ tipo: string; url: string }>
  emailEnvio: string
  codigo: string
  placa: string
  supabase: ReturnType<typeof createAdminClient>
  tenantId: string
}) {
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { ChecklistPDFDoc } = await import('@/components/pdf/ChecklistPDF')

    const checklistData = {
      id: String(checklist.id),
      codigo_sequencial: String(checklist.codigo_sequencial ?? ''),
      motorista_nome: String(checklist.motorista_nome ?? ''),
      placa: String(checklist.placa ?? ''),
      veiculo_modelo: String(checklist.veiculo_nome ?? ''),
      km_atual: Number(checklist.km_atual ?? 0),
      status: String(checklist.status ?? ''),
      created_at: String(checklist.assinado_em ?? new Date().toISOString()),
      tipo: String(checklist.tipo_checklist ?? ''),
      observacoes: String(checklist.observacao ?? ''),
      cpf: String(checklist.cpf_motorista ?? ''),
      email: emailEnvio,
      assinatura_base64: String(checklist.assinatura_base64 ?? ''),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(ChecklistPDFDoc, { checklist: checklistData, itens, fotos }) as any
    )

    // Upload para Supabase Storage
    let pdfUrl: string | null = null
    try {
      // Garantir bucket existe
      await supabase.storage.createBucket('fleetflow-docs', { public: true }).catch(() => {})

      const storagePath = `checklists/${tenantId}/${codigo}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('fleetflow-docs')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('fleetflow-docs')
          .getPublicUrl(storagePath)
        pdfUrl = urlData.publicUrl
      }
    } catch (storageErr) {
      console.error('[PDF Storage]', storageErr)
    }

    // Atualizar checklist com pdf_url
    if (pdfUrl) {
      await supabase
        .from('checklists')
        .update({ pdf_url: pdfUrl })
        .eq('id', checklist.id)
    }

    // Enviar email via Resend
    if (emailEnvio && process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'FleetFlow <noreply@fleetflow.com.br>',
        to: emailEnvio,
        subject: `✅ Checklist ${codigo} — Veículo ${placa}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
            <div style="background:#4B3FE4;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:22px">FleetFlow</h1>
              <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:13px">Sistema de Gestão de Frotas</p>
            </div>
            <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
              <h2 style="color:#1f2937;margin:0 0 8px">Checklist Registrado</h2>
              <p style="color:#6b7280;margin:0 0 24px;font-size:14px">Seu checklist diário foi registrado com sucesso.</p>
              <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                <table style="width:100%;font-size:13px;color:#374151">
                  <tr><td style="padding:4px 0;color:#9ca3af">Protocolo</td><td style="font-weight:700;font-family:monospace">${codigo}</td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af">Veículo</td><td>${placa}</td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af">Motorista</td><td>${checklistData.motorista_nome}</td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af">Status</td><td>${checklistData.status}</td></tr>
                  <tr><td style="padding:4px 0;color:#9ca3af">Data/Hora</td><td>${new Date().toLocaleString('pt-BR')}</td></tr>
                </table>
              </div>
              ${pdfUrl ? `<p style="text-align:center"><a href="${pdfUrl}" style="background:#4B3FE4;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">📄 Baixar PDF do Checklist</a></p>` : ''}
              <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px">Este e-mail foi gerado automaticamente pelo FleetFlow.</p>
            </div>
          </div>
        `,
        attachments: pdfBuffer
          ? [{ filename: `checklist-${codigo}.pdf`, content: pdfBuffer }]
          : [],
      })
    }
  } catch (err) {
    console.error('[gerarPDFEEnviarEmail]', err)
  }
}
