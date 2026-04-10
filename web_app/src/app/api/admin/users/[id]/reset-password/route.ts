import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Resend } from 'resend'
import { getSessionFromRequest, canManageFleet } from '@/utils/auth/session'
import { logAudit, getIp } from '@/utils/audit/logAudit'

function gerarSenha(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `Fleet@${num}`
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { id } = await params

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, nome, acesso')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    const novaSenha = gerarSenha()

    const { error } = await supabase.auth.admin.updateUserById(id, { password: novaSenha })
    if (error) throw error

    // Send email (fire-and-forget)
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fleetflow-tau.vercel.app'
      resend.emails.send({
        from: 'FleetFlow <noreply@fleetflow.com.br>',
        to: profile.email,
        subject: '🔑 Sua senha FleetFlow foi redefinida',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: #0056B3; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900;">🚛 FleetFlow</h1>
            </div>
            <div style="padding: 40px 32px;">
              <h2 style="color: #1e293b; margin: 0 0 16px;">Olá, ${profile.nome}!</h2>
              <p style="color: #64748b; margin: 0 0 24px;">Sua senha foi redefinida por um administrador. Use as novas credenciais abaixo:</p>
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Nova Senha</p>
                <p style="margin: 8px 0 0; font-size: 24px; color: #1e293b; font-weight: 900; letter-spacing: 2px; background: #eff6ff; padding: 10px 14px; border-radius: 8px;">${novaSenha}</p>
              </div>
              ${profile.acesso !== 'app' ? `<div style="text-align: center;"><a href="${appUrl}/login" style="display: inline-block; background: #0056B3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 900;">Acessar o Painel Web →</a></div>` : ''}
            </div>
          </div>
        `,
      }).catch(console.error)
    }

    // G6.3: PASSWORD_RESET (senha nunca no log — R5)
    logAudit({
      ator_email: session.email,
      ator_perfil: session.perfil,
      acao: 'PASSWORD_RESET',
      usuario_afetado_id: id,
      usuario_afetado_email: profile.email,
      ip: getIp(request),
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao redefinir senha'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
