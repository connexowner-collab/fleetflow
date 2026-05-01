import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseAdminKey)

async function test() {
  console.log('Testing RPC exec_sql...')
  const { error: rpcError } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' })
  if (rpcError) {
    console.error('RPC Error:', rpcError)
  } else {
    console.log('RPC exec_sql is working!')
  }

  console.log('Checking veiculo_documentos columns...')
  const { data, error } = await supabase.from('veiculo_documentos').select('*').limit(1)
  if (error) {
    console.error('Select Error:', error)
  } else {
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]))
    } else {
      console.log('Table is empty, checking via information_schema...')
      const { data: cols } = await supabase.rpc('exec_sql_query', { 
         query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'veiculo_documentos';" 
      }).catch(() => ({ data: null }))
      // Note: I didn't create exec_sql_query, so this might fail.
      // I'll just try to insert a dummy row and rollback or delete.
    }
  }
}

test()
