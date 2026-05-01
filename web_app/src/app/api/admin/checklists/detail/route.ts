import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 })

  const supabase = createAdminClient()

  // Buscar itens e fotos em paralelo
  const [itensRes, fotosRes] = await Promise.all([
    supabase.from('checklist_itens').select('nome, conforme').eq('checklist_id', id),
    supabase.from('checklist_fotos').select('tipo, url').eq('checklist_id', id),
  ])

  return NextResponse.json({
    itens: itensRes.data ?? [],
    fotos: fotosRes.data ?? []
  })
}
