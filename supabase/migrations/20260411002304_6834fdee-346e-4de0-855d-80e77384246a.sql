
-- Add description to work_centers
ALTER TABLE public.work_centers ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert default work centers for garment manufacturing
INSERT INTO public.work_centers (code, name, capacity, description) VALUES
  ('CORTE', 'Setor de Corte', 200, 'Máquinas de corte de tecido'),
  ('COSTURA', 'Setor de Costura', 150, 'Máquinas de costura industriais'),
  ('ESTAMPARIA', 'Setor de Estamparia', 100, 'Silk screen e sublimação'),
  ('BORDADO', 'Setor de Bordado', 80, 'Máquinas de bordado'),
  ('ACABAMENTO', 'Setor de Acabamento', 180, 'Revisão e acabamento'),
  ('QUALIDADE', 'Controle de Qualidade', 250, 'Inspeção e conferência'),
  ('EXPEDICAO', 'Expedição', 300, 'Embalagem e expedição')
ON CONFLICT (code) DO NOTHING;
