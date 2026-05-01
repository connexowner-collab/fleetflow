import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseAdminKey)

async function check() {
  const { data, error } = await supabase.from('veiculo_documentos').select('*').limit(5)
  console.log('Sample Data:', data)
  
  // Try to find the constraint via query
  // I need a way to get the result. I'll use a temp table or just assume the error is correct.
  // Actually, I'll try to find if there are duplicate types for the same vehicle in the DB.
}

check()
