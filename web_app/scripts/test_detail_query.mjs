import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testApi() {
  const { data: veiculo, error } = await supabase
    .from('veiculos')
    .select('id, placa')
    .limit(1)
    .single()

  if (error) {
    console.error('Erro ao buscar veículo:', error)
    return
  }

  console.log('Testando veículo ID:', veiculo.id)

  // Simula a chamada da API (internamente no script)
  const { data: full, error: fullError } = await supabase
    .from('veiculos')
    .select('id, placa')
    .eq('id', veiculo.id)
    .single()

  if (fullError) {
    console.error('Erro na query de detalhe:', fullError)
  } else {
    console.log('Sucesso! Veículo encontrado:', full.placa)
  }
}

testApi()
