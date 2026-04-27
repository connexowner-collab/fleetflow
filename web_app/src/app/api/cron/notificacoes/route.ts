import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { criarNotificacaoEPush } from '@/utils/push'

// Protect cron with a shared secret set in CRON_SECRET env var
function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev: allow if no secret configured
  return auth === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const hoje     = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // NOTIF-01 — motoristas sem checklist hoje
  const { data: motoristas } = await supabase
    .from('profiles')
    .select('id, nome, tenant_id, veiculo_id, placa_vinculada')
    .eq('perfil', 'motorista')
    .not('veiculo_id', 'is', null)

  if (motoristas?.length) {
    const { data: checklistsHoje } = await supabase
      .from('checklists')
      .select('motorista_id')
      .gte('created_at', hoje + 'T00:00:00Z')
      .lt('created_at',  hoje + 'T23:59:59Z')

    const comChecklist = new Set((checklistsHoje ?? []).map(c => c.motorista_id))

    const semChecklist = motoristas.filter(m => !comChecklist.has(m.id))

    await Promise.allSettled(
      semChecklist.map(m =>
        criarNotificacaoEPush({
          destinatarioId: m.id,
          tenantId:       m.tenant_id,
          tipo:           'checklist_pendente',
          titulo:         '📋 Checklist Pendente',
          mensagem:       'Você ainda não realizou o checklist diário. Acesse o app para realizá-lo.',
        })
      )
    )
  }

  // NOTIF-02 — documentos vencendo em ≤ 30 dias
  const em30Dias = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  const { data: docs } = await supabase
    .from('documentos')
    .select('id, tipo, vencimento, veiculo_id, veiculos(tenant_id, placa)')
    .lte('vencimento', em30Dias)
    .gte('vencimento', hoje)
    .is('deleted_at', null)

  if (docs?.length) {
    // Get all gestor users per tenant to notify
    type VeiculoJoin = { tenant_id: string; placa: string }
    const tenantIds = [...new Set(docs.map(d => (d.veiculos as unknown as VeiculoJoin)?.tenant_id).filter(Boolean))]

    const { data: gestores } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('perfil', 'gestor')
      .in('tenant_id', tenantIds)

    const gestoresByTenant = new Map<string, string[]>()
    for (const g of gestores ?? []) {
      const arr = gestoresByTenant.get(g.tenant_id) ?? []
      arr.push(g.id)
      gestoresByTenant.set(g.tenant_id, arr)
    }

    await Promise.allSettled(
      docs.flatMap(doc => {
        const v = doc.veiculos as unknown as VeiculoJoin | null
        if (!v) return []
        const ids = gestoresByTenant.get(v.tenant_id) ?? []
        const diasRestantes = Math.ceil((new Date(doc.vencimento).getTime() - Date.now()) / 86400000)
        return ids.map(uid =>
          criarNotificacaoEPush({
            destinatarioId: uid,
            tenantId:       v.tenant_id,
            tipo:           'documento_vencendo',
            titulo:         '⚠️ Documento Vencendo',
            mensagem:       `${doc.tipo} do veículo ${v.placa} vence em ${diasRestantes} dia(s).`,
          })
        )
      })
    )
  }

  return NextResponse.json({ ok: true, data: { motoristas_sem_checklist: (motoristas ?? []).length, docs_vencendo: (docs ?? []).length } })
}
