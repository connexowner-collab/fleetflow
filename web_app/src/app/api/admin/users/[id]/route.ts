import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest, canManageFleet } from '@/utils/auth/session'
import { logAudit, getIp } from '@/utils/audit/logAudit'

const roleMap: Record<string, string> = {
  'Motorista': 'motorista',
  'Analista de Frota': 'analista',
  'Gestor': 'gestor',
  'Diretor': 'diretor',
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // G5.1
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { id } = await params
  const body = await request.json()
  const { nome, cargo, ativo, telas_permitidas, veiculo_id, placa, telefone, filial } = body

  try {
    // Fetch current state for diff and audit
    const { data: current } = await supabase
      .from('profiles')
      .select('nome, perfil, ativo, telas_permitidas, veiculo_id, placa_vinculada, email, telefone, filial, session_version')
      .eq('id', id)
      .single()

    const updates: Record<string, unknown> = {}
    if (nome !== undefined) updates.nome = nome
    if (cargo !== undefined) updates.perfil = roleMap[cargo] ?? cargo
    if (ativo !== undefined) updates.ativo = ativo
    if (telas_permitidas !== undefined) updates.telas_permitidas = telas_permitidas
    if (veiculo_id !== undefined) updates.veiculo_id = veiculo_id || null
    if (placa !== undefined) updates.placa_vinculada = placa || null
    if (telefone !== undefined) updates.telefone = telefone || null
    if (filial !== undefined) updates.filial = filial || null

    // G4.3: Increment session_version on deactivation to invalidate active sessions
    if (ativo === false && current?.ativo !== false) {
      updates.session_version = (current?.session_version ?? 0) + 1
    }

    // G4.4: Exclusive vehicle binding check
    if (veiculo_id && veiculo_id !== current?.veiculo_id) {
      const { data: existingBinding } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('veiculo_id', veiculo_id)
        .eq('ativo', true)
        .is('deleted_at', null)
        .neq('id', id)
        .single()

      if (existingBinding) {
        return NextResponse.json(
          { error: `Veículo já está vinculado ao usuário "${existingBinding.nome}".` },
          { status: 409 }
        )
      }
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) throw error

    const affectedEmail = current?.email ?? ''

    // G6.3: Determine audit event
    if (ativo === true && current?.ativo === false) {
      logAudit({
        ator_email: session.email, ator_perfil: session.perfil,
        acao: 'USER_ACTIVATED',
        usuario_afetado_id: id, usuario_afetado_email: affectedEmail,
        ip: getIp(request),
      })
    } else if (ativo === false && current?.ativo !== false) {
      logAudit({
        ator_email: session.email, ator_perfil: session.perfil,
        acao: 'USER_DEACTIVATED',
        usuario_afetado_id: id, usuario_afetado_email: affectedEmail,
        ip: getIp(request),
      })
    } else if (telas_permitidas !== undefined) {
      logAudit({
        ator_email: session.email, ator_perfil: session.perfil,
        acao: 'PERMISSIONS_CHANGED',
        usuario_afetado_id: id, usuario_afetado_email: affectedEmail,
        dados_antes: { telas_permitidas: current?.telas_permitidas },
        dados_depois: { telas_permitidas },
        ip: getIp(request),
      })
    } else {
      // Generic edit
      const dados_antes: Record<string, unknown> = {}
      const dados_depois: Record<string, unknown> = {}
      if (nome && nome !== current?.nome) { dados_antes.nome = current?.nome; dados_depois.nome = nome }
      if (cargo) { dados_antes.perfil = current?.perfil; dados_depois.perfil = roleMap[cargo] ?? cargo }
      if (telefone !== undefined) { dados_antes.telefone = current?.telefone; dados_depois.telefone = telefone }
      if (filial !== undefined) { dados_antes.filial = current?.filial; dados_depois.filial = filial }

      if (Object.keys(dados_depois).length > 0) {
        logAudit({
          ator_email: session.email, ator_perfil: session.perfil,
          acao: 'USER_EDITED',
          usuario_afetado_id: id, usuario_afetado_email: affectedEmail,
          dados_antes, dados_depois,
          ip: getIp(request),
        })
      }
    }

    // G6.3: Vehicle link changes
    if (veiculo_id !== undefined && veiculo_id !== current?.veiculo_id) {
      if (veiculo_id) {
        logAudit({
          ator_email: session.email, ator_perfil: session.perfil,
          acao: 'VEHICLE_LINKED',
          usuario_afetado_id: id, usuario_afetado_email: affectedEmail,
          dados_antes: { veiculo_id: current?.veiculo_id },
          dados_depois: { veiculo_id, placa },
          ip: getIp(request),
        })
      } else if (current?.veiculo_id) {
        logAudit({
          ator_email: session.email, ator_perfil: session.perfil,
          acao: 'VEHICLE_UNLINKED',
          usuario_afetado_id: id, usuario_afetado_email: affectedEmail,
          dados_antes: { veiculo_id: current.veiculo_id, placa: current.placa_vinculada },
          ip: getIp(request),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao editar usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // G5.1
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { id } = await params

  try {
    // Fetch before deleting for audit log
    const { data: current } = await supabase
      .from('profiles')
      .select('email, nome, perfil, session_version')
      .eq('id', id)
      .single()

    // G4.1: Soft delete — set deleted_at instead of hard-deleting auth user
    const { error } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        ativo: false,
        session_version: (current?.session_version ?? 0) + 1, // G4.3
      })
      .eq('id', id)

    if (error) throw error

    // Also ban in Supabase Auth to prevent re-login with existing password
    await supabase.auth.admin.updateUserById(id, { ban_duration: '87600h' })

    // G6.3: USER_DELETED
    logAudit({
      ator_email: session.email, ator_perfil: session.perfil,
      acao: 'USER_DELETED',
      usuario_afetado_id: id,
      usuario_afetado_email: current?.email,
      dados_antes: { nome: current?.nome, perfil: current?.perfil, email: current?.email },
      ip: getIp(request),
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
