import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from('veiculos')
      .select('id, placa, modelo, status')
      .order('placa')
    if (error) throw error
    return NextResponse.json({ veiculos: data ?? [] })
  } catch {
    return NextResponse.json({ veiculos: [] })
  }
}
