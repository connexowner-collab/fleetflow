# Como aplicar o schema no Supabase

O schema não pôde ser aplicado automaticamente pois requer a senha do banco de dados
(diferente da service_role key).

## Passos para aplicar:

1. Acesse: https://supabase.com/dashboard/project/ywjyyuqsjjhclqomwrsr/sql/new

2. Copie todo o conteúdo do arquivo `schema.sql` desta pasta

3. Cole no editor SQL e clique em **Run**

## Ou via Supabase CLI (se tiver a DB password):

```bash
psql postgresql://postgres:[SUA_SENHA_DB]@db.ywjyyuqsjjhclqomwrsr.supabase.co:5432/postgres -f supabase/schema.sql
```

A senha do banco está em:
Dashboard > Settings > Database > Database password
