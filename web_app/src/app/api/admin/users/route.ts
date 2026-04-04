import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Resend } from 'resend'

const roleMap: Record<string, string> = {
  'Motorista': 'motorista',
  'Analista de Frota': 'analista',
  'Gestor': 'gestor',
  'Diretor': 'diretor',
}

function gerarSenha(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `Fleet@${num}`
}

async function enviarEmailAcesso(params: {
  email: string
  nome: string
  senha: string
  perfil: string
  acesso: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return // sem chave configurada, pula o e-mail

  const resend = new Resend(apiKey)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://webapp-peach-six.vercel.app'

  const acessoTexto = params.acesso === 'app'
    ? 'Aplicativo Mobile (Android)'
    : params.acesso === 'web'
    ? 'Painel Web'
    : 'Aplicativo Mobile + Painel Web'

  await resend.emails.send({
    from: 'FleetFlow <noreply@fleetflow.com.br>',
    to: params.email,
    subject: '🚛 Seu acesso ao FleetFlow está pronto',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f6f9; padding: 40px 0; margin: 0;">
        <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background: #0056B3; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">🚛 FleetFlow</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Plataforma de Gestão de Frotas</p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 32px;">
            <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Olá, ${params.nome}! 👋</h2>
            <p style="color: #64748b; margin: 0 0 32px; line-height: 1.6;">
              Seu acesso ao <strong>FleetFlow</strong> foi criado. Use as credenciais abaixo para entrar.
            </p>

            <!-- Credentials Box -->
            <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
              <p style="margin: 0 0 4px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Suas Credenciais de Acesso</p>

              <div style="margin-top: 16px;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; font-weight: bold;">E-MAIL</p>
                <p style="margin: 0 0 16px; font-size: 16px; color: #0056B3; font-weight: 900; background: #eff6ff; padding: 10px 14px; border-radius: 8px;">${params.email}</p>
              </div>

              <div>
                <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; font-weight: bold;">SENHA</p>
                <p style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 900; background: #eff6ff; padding: 10px 14px; border-radius: 8px; letter-spacing: 2px;">${params.senha}</p>
              </div>
            </div>

            <!-- Access info -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 28px;">
              <p style="margin: 0; font-size: 13px; color: #166534;">
                ✅ <strong>Tipo de acesso:</strong> ${acessoTexto}
              </p>
            </div>

            <!-- CTA Button -->
            ${params.acesso !== 'app' ? `
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${appUrl}/login" style="display: inline-block; background: #0056B3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 900; font-size: 15px;">
                Acessar o Painel Web →
              </a>
            </div>` : ''}

            <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.6;">
              Por segurança, recomendamos alterar sua senha após o primeiro acesso.<br>
              Em caso de dúvidas, entre em contato com o administrador da sua empresa.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">© 2026 FleetFlow SaaS Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function GET() {
  const supabase = createAdminClient()
  try {
    const full = await supabase
      .from('profiles')
      .select('id, nome, email, perfil, ativo, telas_permitidas, veiculo_id, tenant_id, tenants(nome), veiculos(id, placa, modelo)')
      .order('created_at', { ascending: false })

    if (full.error) {
      const fallback = await supabase
        .from('profiles')
        .select('id, nome, email, perfil, ativo, telas_permitidas, tenant_id, tenants(nome)')
        .order('created_at', { ascending: false })
      return NextResponse.json({ users: fallback.data ?? [] })
    }

    return NextResponse.json({ users: full.data ?? [] })
  } catch {
    return NextResponse.json({ users: [] })
  }
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { email, nome, cargo, acesso, telas, veiculo_id, placa } = body

  const perfil = roleMap[cargo] ?? 'motorista'
  const telasPermitidas = telas ?? ['checklist', 'troca', 'ocorrencia', 'historico']
  const senha = gerarSenha()

  try {
    // Cria usuário com senha gerada e confirma e-mail automaticamente
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, perfil },
    })
    if (error) throw error

    // Atualiza perfil com telas, veículo e acesso
    if (data.user) {
      const updates: Record<string, unknown> = {
        telas_permitidas: telasPermitidas,
        acesso: acesso ?? 'app',
      }
      if (veiculo_id) updates.veiculo_id = veiculo_id
      if (placa) updates.placa_vinculada = placa
      await supabase.from('profiles').update(updates).eq('id', data.user.id)
    }

    // Envia e-mail com credenciais
    await enviarEmailAcesso({ email, nome, senha, perfil, acesso: acesso ?? 'app' })

    return NextResponse.json({ user: data.user, senha })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
