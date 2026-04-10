import { createAdminClient } from '@/utils/supabase/admin'

export type AuditEvent =
  | 'USER_CREATED'
  | 'USER_EDITED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'USER_DELETED'
  | 'PASSWORD_RESET'
  | 'VEHICLE_LINKED'
  | 'VEHICLE_UNLINKED'
  | 'PERMISSIONS_CHANGED'

export interface AuditEntry {
  tenant_id?: string
  ator_id?: string
  ator_email: string
  ator_perfil: string
  acao: AuditEvent
  usuario_afetado_id?: string
  usuario_afetado_email?: string
  dados_antes?: Record<string, unknown>
  dados_depois?: Record<string, unknown>
  ip?: string
  ambiente?: string
}

/**
 * Registra uma entrada no log de auditoria de forma assíncrona e não-bloqueante.
 * Falha no log não bloqueia nem reverte a ação principal (R4).
 */
export function logAudit(entry: AuditEntry): void {
  const supabase = createAdminClient()
  void supabase
    .from('audit_logs')
    .insert({ ambiente: 'web', ...entry })
    .then(({ error }) => { if (error) console.error('[audit]', error) })
}

export function getIp(request: Request): string {
  const fwd = (request as { headers: { get(k: string): string | null } }).headers.get('x-forwarded-for')
  return fwd ? fwd.split(',')[0].trim() : 'unknown'
}
