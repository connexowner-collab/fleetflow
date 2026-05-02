-- =====================================================================
-- FIX: Remove CHECK constraint em checklist_fotos.tipo
-- Problema: A constraint só aceitava 'frente','traseira','extra'
-- mas o app envia 'Frente','Traseira','Assinatura','Avaria: ...' etc.
-- Isso causava silencioso bloqueio de TODOS os inserts de fotos.
-- =====================================================================

-- 1. Remover a constraint antiga
ALTER TABLE public.checklist_fotos
  DROP CONSTRAINT IF EXISTS checklist_fotos_tipo_check;

-- 2. Recuperar fotos do CHK-00019 (fd8c5e1e) que estão no Storage mas não na tabela
INSERT INTO public.checklist_fotos (checklist_id, tipo, url) VALUES
('fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Frente',    'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/1777696072924_foto_frente.png'),
('fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Traseira',  'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/1777696074208_foto_tras.png'),
('fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Avaria: 0', 'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/1777696075324_avaria_0.png'),
('fd8c5e1e-5afd-4862-81a0-f22dd993be3c', 'Assinatura','https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fd8c5e1e-5afd-4862-81a0-f22dd993be3c/assinatura_1777696076245.png')
ON CONFLICT DO NOTHING;

-- 3. Recuperar fotos do CHK-00020 (fedfd136)
INSERT INTO public.checklist_fotos (checklist_id, tipo, url) VALUES
('fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Frente',    'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/1777697032369_foto_frente.png'),
('fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Traseira',  'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/1777697033396_foto_tras.png'),
('fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Avaria: 0', 'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/1777697034824_avaria_0.png'),
('fedfd136-d539-4a82-a61c-7eab7f1224a0', 'Assinatura','https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/fedfd136-d539-4a82-a61c-7eab7f1224a0/assinatura_1777697035745.png')
ON CONFLICT DO NOTHING;

-- 4. Recuperar fotos do CHK-00018 (6a42a8a7)
INSERT INTO public.checklist_fotos (checklist_id, tipo, url) VALUES
('6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Frente',    'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/1777665234934_foto_frente.jpeg'),
('6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Traseira',  'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/1777665235795_foto_tras.jpeg'),
('6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Avaria: 0', 'https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/1777665236662_avaria_0.jpeg'),
('6a42a8a7-9b09-46a1-a50b-d42eaef14a41', 'Assinatura','https://ywjyyuqsjjhclqomwrsr.supabase.co/storage/v1/object/public/fleetflow-docs/6a42a8a7-9b09-46a1-a50b-d42eaef14a41/assinatura_1777665237584.png')
ON CONFLICT DO NOTHING;

-- 5. Verificar resultado
SELECT
  c.codigo,
  COUNT(f.id) as total_fotos
FROM public.checklists c
LEFT JOIN public.checklist_fotos f ON f.checklist_id = c.id
WHERE c.codigo IN ('CHK-00018','CHK-00019','CHK-00020')
GROUP BY c.codigo
ORDER BY c.codigo;
