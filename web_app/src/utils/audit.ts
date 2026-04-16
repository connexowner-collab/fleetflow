import { createAdminClient } from '@/utils/supabase/admin'

export type AuditAcao =
  | 'USER_CREATED' | 'USER_EDITED' | 'USER_DELETED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED'
  | 'PASSWORD_RESET' | 'VEHICLE_LINKED' | 'VEHICLE_UNLINKED'
  | 'VEHICLE_CREATED' | 'VEHICLE_EDITED' | 'VEHICLE_DELETED'
  | 'MANUTENCAO_CRIADA' | 'MANUTENCAO_INICIADA' | 'MANUTENCAO_RECUSADA'
  | 'MANUTENCAO_AGUARDANDO' | 'MANUTENCAO_EM_ANDAMENTO' | 'MANUTENCAO_CONCLUIDA'
  | 'MANUTENCAO_CANCELADA' | 'MANUTENCAO_REPROVADA' | 'MANUTENCAO_RETORNADA'
  | 'CHECKLIST_CREATED' | 'CHECKLIST_VALIDATED' | 'CHECKLIST_PDF_GERADO' | 'CHECKLIST_PDF_VISUALIZADO'
  | 'CHECKLIST_SOLICITADO' | 'CHECKLIST_SOLICITACAO_CANCELADA'
  | 'FILIAL_CRIADA' | 'FILIAL_EDITADA' | 'FILIAL_DESATIVADA'
  | 'CONFIG_ALTERADA' | 'LOGIN' | 'LOGOUT'

export interface AuditPayload {
  acao: AuditAcao
  tenant_id?: string | null
  ator_id?: string | null
  ator_email: string
  ator_perfil: string
  usuario_afetado_id?: string | null
  usuario_afetado_email?: string | null
  dados_antes?: Record<string, unknown> | null
  dados_depois?: Record<string, unknown> | null
  ip?: string | null
  ambiente?: string
}

/**
 * Registra evento de auditoria de forma não-bloqueante.
 * Falhas são silenciosas para não prejudicar o fluxo principal.
 */
export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    const db = createAdminClient()
    await db.from('audit_logs').insert({
      tenant_id:             payload.tenant_id ?? null,
      ator_id:               payload.ator_id ?? null,
      ator_email:            payload.ator_email,
      ator_perfil:           payload.ator_perfil,
      acao:                  payload.acao,
      usuario_afetado_id:    payload.usuario_afetado_id ?? null,
      usuario_afetado_email: payload.usuario_afetado_email ?? null,
      dados_antes:           payload.dados_antes ?? null,
      dados_depois:          payload.dados_depois ?? null,
      ip:                    payload.ip ?? null,
      ambiente:              payload.ambiente ?? 'web',
    })
  } catch {
    // silencioso — auditoria nunca bloqueia a ação principal
  }
}

/** Extrai IP da requisição Next.js */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}
