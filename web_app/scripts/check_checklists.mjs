import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseAdminKey)

async function check() {
  const { data } = await supabase.from('checklists').select('*').limit(1)
  if (data && data.length > 0) console.log('Checklists Columns:', Object.keys(data[0]))
  
  const { data: data2 } = await supabase.from('checklist_respostas').select('*').limit(1)
  if (data2 && data2.length > 0) console.log('Respostas Columns:', Object.keys(data2[0]))
}

check()
