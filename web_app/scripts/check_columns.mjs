import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseAdminKey)

async function checkColumns() {
  // Query to get column names via RPC if available, or just try to select
  const { data, error } = await supabase
    .from('veiculo_documentos')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error selecting from veiculo_documentos:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]))
  } else {
    // If table is empty, try to get schema info via rpc if it exists
    console.log('Table is empty. Trying to find columns via alternative way...')
    const { data: cols, error: err2 } = await supabase.rpc('get_table_columns', { table_name: 'veiculo_documentos' })
    if (err2) {
       console.log('RPC get_table_columns failed (expected if not exists).')
    } else {
       console.log('Columns via RPC:', cols)
    }
  }
}

checkColumns()
