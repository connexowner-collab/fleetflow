import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

// GET /api/admin/checklists/[id]  → returns checklist + itens + fotos
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

  const [checklistRes, itensRes, fotosRes] = await Promise.all([
    supabase
      .from('checklists')
      .select(
        'id, codigo, codigo_sequencial, motorista_nome, placa, veiculo_nome, km_atual, km_anterior, status, tipo_checklist, unidade, setor, area, observacao, assinatura_base64, cpf_motorista, pdf_url, tem_avaria, created_at, assinado_em'
      )
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single(),
    supabase
      .from('checklist_itens')
      .select('nome, conforme')
      .eq('checklist_id', id),
    supabase
      .from('checklist_fotos')
      .select('tipo, url')
      .eq('checklist_id', id),
  ])

  return NextResponse.json({
    checklist: checklistRes.data ?? null,
    itens: itensRes.data ?? [],
    fotos: fotosRes.data ?? [],
  })
}
