import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('avatar') as File | null

  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })

  const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Imagem muito grande. Máximo 2 MB.' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG, WebP ou GIF.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Garante que o bucket existe
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === 'avatars')
  if (!bucketExists) {
    await supabase.storage.createBucket('avatars', { public: true, fileSizeLimit: MAX_SIZE })
  }

  // Converte File para ArrayBuffer → Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Nome único por usuário (sobrescreve sempre o mesmo arquivo)
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const fileName = `${session.email.replace(/[^a-z0-9]/gi, '_')}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // URL pública
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
  const avatar_url = `${urlData.publicUrl}?t=${Date.now()}` // cache bust

  // Atualiza profiles
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url })
    .eq('email', session.email)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true, avatar_url })
}
