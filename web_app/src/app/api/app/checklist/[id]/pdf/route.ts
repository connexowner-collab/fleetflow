import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'
import React from 'react'

// GET /api/app/checklist/[id]/pdf  → gera/retorna PDF para o motorista
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

  const { id: checklistId } = await params

  // Buscar checklist — garantir que pertence ao motorista
  const [checklistRes, itensRes, fotosRes] = await Promise.all([
    supabase
      .from('checklists')
      .select('id, codigo, codigo_sequencial, motorista_nome, placa, veiculo_nome, km_atual, status, tipo_checklist, unidade, setor, area, observacao, assinatura_base64, cpf_motorista, pdf_url, created_at, assinado_em')
      .eq('id', checklistId)
      .eq('motorista_id', profile.id)
      .single(),
    supabase.from('checklist_itens').select('nome, conforme').eq('checklist_id', checklistId),
    supabase.from('checklist_fotos').select('tipo, url').eq('checklist_id', checklistId),
  ])

  if (!checklistRes.data) {
    return NextResponse.json({ error: 'Checklist não encontrado.' }, { status: 404 })
  }

  const checklist = checklistRes.data
  const itens = itensRes.data ?? []
  const fotos = fotosRes.data ?? []

  // Se já tem pdf_url, redirecionar
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
      const codigo = checklist.codigo_sequencial ?? checklist.codigo ?? checklistId
      const storagePath = `checklists/${profile.tenant_id}/${codigo}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('fleetflow-docs')
        .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('fleetflow-docs').getPublicUrl(storagePath)
        if (urlData?.publicUrl) {
          await supabase.from('checklists').update({ pdf_url: urlData.publicUrl }).eq('id', checklistId)
        }
      }
    } catch { /* falha silenciosa */ }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="checklist-${checklist.codigo_sequencial ?? checklistId}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error('[PDF App Error]', err)
    return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 })
  }
}
