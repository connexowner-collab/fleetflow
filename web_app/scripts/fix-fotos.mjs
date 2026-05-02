import pg from 'pg'
const { Client } = pg

// Conectar via Transaction Pooler do Supabase (porta 6543)
// usando service_role_key como senha (funciona em alguns projetos Supabase)
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3anl5dXFzampoY2xxb213cnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE3NTU3NiwiZXhwIjoyMDkwNzUxNTc2fQ.Rcz2CMQfJXj2593ry5kcgqIsHV9Q6GIlbnTAGQ0UAMs'
const PROJECT_REF = 'ywjyyuqsjjhclqomwrsr'

const regions = ['us-east-1','us-west-1','eu-west-1','eu-west-2','ap-southeast-1','ap-northeast-1','sa-east-1']
const configs = [
  // Direct connection
  { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: 'postgres', password: SERVICE_ROLE, database: 'postgres', ssl: { rejectUnauthorized: false } },
  // Todas as regiões, porta 5432 e 6543
  ...regions.flatMap(r => [
    { host: `aws-0-${r}.pooler.supabase.com`, port: 5432, user: `postgres.${PROJECT_REF}`, password: SERVICE_ROLE, database: 'postgres', ssl: { rejectUnauthorized: false } },
    { host: `aws-0-${r}.pooler.supabase.com`, port: 6543, user: `postgres.${PROJECT_REF}`, password: SERVICE_ROLE, database: 'postgres', ssl: { rejectUnauthorized: false } },
  ])
]

async function runSQL(client) {
  console.log('Conectado! Executando correções...\n')

  // 1. Remover constraint
  await client.query(`ALTER TABLE public.checklist_fotos DROP CONSTRAINT IF EXISTS checklist_fotos_tipo_check`)
  console.log('✅ Constraint removida')

  // 2. Inserir fotos CHK-00019
  const fotos19 = [
    ['fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Frente',    'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/1777696072924_foto_frente.png'],
    ['fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Traseira',  'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/1777696074208_foto_tras.png'],
    ['fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Avaria: 0', 'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/1777696075324_avaria_0.png'],
    ['fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Assinatura','https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/assinatura_1777696076245.png'],
  ]

  // 3. Inserir fotos CHK-00020
  const fotos20 = [
    ['fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Frente',    'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/1777697032369_foto_frente.png'],
    ['fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Traseira',  'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/1777697033396_foto_tras.png'],
    ['fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Avaria: 0', 'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/1777697034824_avaria_0.png'],
    ['fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Assinatura','https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/assinatura_1777697035745.png'],
  ]

  // 4. Inserir fotos CHK-00018
  const fotos18 = [
    ['6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Frente',    'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/1777665234934_foto_frente.jpeg'],
    ['6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Traseira',  'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/1777665235795_foto_tras.jpeg'],
    ['6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Avaria: 0', 'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/1777665236662_avaria_0.jpeg'],
    ['6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Assinatura','https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/assinatura_1777665237584.png'],
  ]

  for (const [cid, tipo, url] of [...fotos18, ...fotos19, ...fotos20]) {
    await client.query(
      `INSERT INTO public.checklist_fotos (checklist_id, tipo, url) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [cid, tipo, url]
    )
  }
  console.log('✅ Fotos inseridas (18, 19, 20)')

  // Verificar resultado
  const res = await client.query(`
    SELECT c.codigo, COUNT(f.id) as fotos
    FROM public.checklists c
    LEFT JOIN public.checklist_fotos f ON f.checklist_id = c.id
    WHERE c.codigo IN ('CHK-00018','CHK-00019','CHK-00020')
    GROUP BY c.codigo ORDER BY c.codigo
  `)
  console.log('\n=== RESULTADO FINAL ===')
  for (const row of res.rows) {
    console.log(`${row.codigo}: ${row.fotos} fotos`)
  }
}

let connected = false
for (const config of configs) {
  console.log(`Tentando: ${config.host}:${config.port} user=${config.user}`)
  const client = new Client({ ...config, connectionTimeoutMillis: 8000 })
  try {
    await client.connect()
    connected = true
    await runSQL(client)
    await client.end()
    break
  } catch (err) {
    console.log(`❌ Falhou: ${err.message}`)
    try { await client.end() } catch {}
  }
}

if (!connected) {
  console.log('\n⚠️  Não foi possível conectar via pg. Precisa executar o SQL no dashboard do Supabase.')
  console.log('URL: https://supabase.com/dashboard/project/ywjyyuqsjjhclqomwrsr/sql/new')
}
