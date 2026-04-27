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

  if (profile.placa_vinculada) {
    query = query.eq('placa', profile.placa_vinculada)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ checklists: data ?? [], total: count ?? 0, page, limit })
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nome, placa_vinculada, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
  if (!profile.placa_vinculada) return NextResponse.json({ error: 'Nenhum veículo vinculado.' }, { status: 400 })

  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('id, placa, modelo, marca, chassi, km_atual')
    .eq('placa', profile.placa_vinculada)
    .eq('tenant_id', profile.tenant_id)
    .is('deleted_at', null)
    .single()

  if (!veiculo) return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })

  // Parsear FormData ou JSON
  let body: Record<string, unknown>
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    body = await request.json()
  } else {
    const formData = await request.formData()
    body = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => !(v instanceof File))
    )
  }

  const kmAtual = parseInt(String(body.km_atual ?? '0'))

  if (kmAtual < (veiculo.km_atual ?? 0)) {
    return NextResponse.json({
      error: `KM Atual deve ser maior ou igual ao KM anterior (${veiculo.km_atual} km).`
    }, { status: 400 })
  }

  // Gerar código sequencial
  const { count } = await supabase
    .from('checklists')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)

  const seq = String((count ?? 0) + 1).padStart(5, '0')
  const codigo = `CHK-${seq}`

  // Parsear itens de inspeção
  const itens: Array<{ nome: string; conforme: boolean }> = []
  try {
    const raw = body.itens ?? body.inspecao ?? '[]'
    const parsed = JSON.parse(String(raw))
    if (Array.isArray(parsed)) {
      itens.push(...parsed)
    } else if (typeof parsed === 'object') {
      for (const [nome, val] of Object.entries(parsed)) {
        itens.push({ nome, conforme: val === 'ok' || val === true })
      }
    }
  } catch { /* */ }

  // Parsear avarias
  const avarias: Array<{ descricao: string; tipo: string; gravidade: string }> = []
  try { avarias.push(...JSON.parse(String(body.avarias ?? '[]'))) } catch { /* */ }

  const temAvaria = avarias.length > 0
  const temNaoConforme = itens.some(i => !i.conforme)
  const status = temAvaria || temNaoConforme ? 'Com Pendências' : 'Aprovado'

  const emailEnvio = String(body.email_envio ?? body.email ?? session.email)
  const tipoChecklist = body.tipo_checklist
    ? String(body.tipo_checklist)
    : (body.tipo === 'pos' ? 'Pós-operação' : 'Pré-operação')

  // Inserir checklist
  const { data: checklist, error } = await supabase
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
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Inserir itens
  if (itens.length > 0) {
    await supabase.from('checklist_itens').insert(
      itens.map(i => ({ checklist_id: checklist.id, nome: i.nome, conforme: i.conforme }))
    )
  }

  // Atualizar KM do veículo
  await supabase.from('veiculos').update({ km_atual: kmAtual }).eq('id', veiculo.id)

  // Fechar solicitação pendente se houver
  try {
    await supabase
      .from('checklist_solicitacoes')
      .update({ atendido_em: new Date().toISOString() })
      .eq('motorista_id', profile.id)
      .is('atendido_em', null)
      .is('cancelado_em', null)
  } catch { /* tabela pode não existir ainda */ }

  // Gerar PDF e enviar email em background (fire-and-forget)
  gerarPDFEEnviarEmail({
    checklist,
    itens,
    emailEnvio,
    codigo,
    placa: veiculo.placa,
    supabase,
    tenantId: profile.tenant_id,
  }).catch(err => console.error('[PDF/Email]', err))

  return NextResponse.json({ checklist, codigo })
}

async function gerarPDFEEnviarEmail({
  checklist,
  itens,
  emailEnvio,
  codigo,
  placa,
  supabase,
  tenantId,
}: {
  checklist: Record<string, unknown>
  itens: Array<{ nome: string; conforme: boolean }>
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(ChecklistPDFDoc, { checklist: checklistData, itens, fotos: [] }) as any
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
