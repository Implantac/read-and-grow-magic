
-- ============ NPS Question Bank ============
CREATE TABLE public.nps_question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  is_global BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text',
  options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nps_qb_scope CHECK (is_global = true OR company_id IS NOT NULL)
);

CREATE INDEX idx_nps_qb_company ON public.nps_question_bank(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_nps_qb_global ON public.nps_question_bank(is_global) WHERE is_global = true;
CREATE INDEX idx_nps_qb_category ON public.nps_question_bank(category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_question_bank TO authenticated;
GRANT ALL ON public.nps_question_bank TO service_role;

ALTER TABLE public.nps_question_bank ENABLE ROW LEVEL SECURITY;

-- Leitura: globais + da empresa do usuário
CREATE POLICY "nps_qb_read"
  ON public.nps_question_bank
  FOR SELECT
  TO authenticated
  USING (
    is_global = true
    OR company_id = public.get_user_company_id(auth.uid())
  );

-- Escrita: apenas admin/manager da própria empresa (nunca em globais)
CREATE POLICY "nps_qb_insert"
  ON public.nps_question_bank
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_global = false
    AND company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE POLICY "nps_qb_update"
  ON public.nps_question_bank
  FOR UPDATE
  TO authenticated
  USING (
    is_global = false
    AND company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  )
  WITH CHECK (
    is_global = false
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "nps_qb_delete"
  ON public.nps_question_bank
  FOR DELETE
  TO authenticated
  USING (
    is_global = false
    AND company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- Trigger de updated_at (usa função pública já existente no projeto)
CREATE TRIGGER trg_nps_qb_updated_at
  BEFORE UPDATE ON public.nps_question_bank
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Seed de perguntas globais ============
INSERT INTO public.nps_question_bank (is_global, category, question_text, question_type, required, tags) VALUES
  (true, 'Atendimento', 'Como você avalia o atendimento recebido?', 'stars', false, ARRAY['atendimento','satisfacao']),
  (true, 'Atendimento', 'O atendente foi cordial e prestativo?', 'radio', false, ARRAY['atendimento']),
  (true, 'Atendimento', 'Seu problema foi resolvido no primeiro contato?', 'radio', false, ARRAY['atendimento','fcr']),
  (true, 'Atendimento', 'Quanto tempo levou para ser atendido?', 'dropdown', false, ARRAY['atendimento','tempo']),
  (true, 'Atendimento', 'Deixe um comentário sobre o atendimento', 'text', false, ARRAY['atendimento','comentario']),

  (true, 'Produto', 'Como você avalia a qualidade do produto?', 'stars', false, ARRAY['produto','qualidade']),
  (true, 'Produto', 'O produto atendeu suas expectativas?', 'radio', false, ARRAY['produto','expectativa']),
  (true, 'Produto', 'Você já indicou nossos produtos a alguém?', 'radio', false, ARRAY['produto','indicacao']),
  (true, 'Produto', 'O que você mudaria no produto?', 'text', false, ARRAY['produto','melhoria']),

  (true, 'Entrega', 'A entrega ocorreu no prazo prometido?', 'radio', false, ARRAY['entrega','prazo']),
  (true, 'Entrega', 'Como você avalia a embalagem?', 'stars', false, ARRAY['entrega','embalagem']),
  (true, 'Entrega', 'O produto chegou em perfeitas condições?', 'radio', false, ARRAY['entrega','integridade']),
  (true, 'Entrega', 'Comentários sobre a entrega', 'text', false, ARRAY['entrega','comentario']),

  (true, 'Preço', 'O preço pago é compatível com o valor recebido?', 'radio', false, ARRAY['preco','custo-beneficio']),
  (true, 'Preço', 'Como avalia nossas condições de pagamento?', 'stars', false, ARRAY['preco','pagamento']),

  (true, 'Pós-venda', 'Você recebeu algum acompanhamento após a compra?', 'radio', false, ARRAY['posvenda']),
  (true, 'Pós-venda', 'Você voltaria a comprar conosco?', 'radio', false, ARRAY['posvenda','recompra']),
  (true, 'Pós-venda', 'O que faria você comprar novamente?', 'text', false, ARRAY['posvenda','recompra']),

  (true, 'Recomendação', 'A quem você recomendaria nosso produto/serviço?', 'checkbox', false, ARRAY['indicacao']),
  (true, 'Recomendação', 'Qual foi o principal motivo da sua nota?', 'text', true, ARRAY['motivo','driver']),
  (true, 'Recomendação', 'O que precisaria acontecer para você nos dar nota 10?', 'text', false, ARRAY['melhoria','driver']),

  (true, 'Motivo de churn', 'Se pudesse voltar atrás, você compraria de novo?', 'radio', false, ARRAY['churn']),
  (true, 'Motivo de churn', 'Está considerando trocar de fornecedor?', 'radio', false, ARRAY['churn','risco']),
  (true, 'Motivo de churn', 'O que estamos deixando de entregar?', 'text', false, ARRAY['churn','melhoria']),

  (true, 'Experiência digital', 'Como avalia nosso site/aplicativo?', 'stars', false, ARRAY['digital','ux']),
  (true, 'Experiência digital', 'Foi fácil concluir seu pedido?', 'likert', false, ARRAY['digital','ux','ces']),
  (true, 'Experiência digital', 'Sentiu falta de alguma funcionalidade?', 'text', false, ARRAY['digital','melhoria']),

  (true, 'Perfil', 'Qual seu papel na empresa?', 'dropdown', false, ARRAY['perfil','segmentacao']),
  (true, 'Perfil', 'Há quanto tempo é nosso cliente?', 'dropdown', false, ARRAY['perfil','tempo']),

  (true, 'CSAT', 'De maneira geral, qual seu nível de satisfação?', 'emoji', false, ARRAY['csat']),
  (true, 'CES', 'Quão fácil foi resolver sua demanda conosco?', 'likert', false, ARRAY['ces','esforço']),
  (true, 'Autorização', 'Podemos entrar em contato para aprofundar seu feedback?', 'radio', false, ARRAY['contato','autorizacao']);

-- Opções default para tipos que dependem de escolha
UPDATE public.nps_question_bank SET options = '{"choices":["Sim","Não","Em parte"]}'::jsonb
  WHERE is_global = true AND question_type = 'radio' AND options IS NULL;

UPDATE public.nps_question_bank SET options = '{"choices":["Menos de 1 minuto","Até 5 minutos","Até 15 minutos","Mais de 15 minutos"]}'::jsonb
  WHERE is_global = true AND question_text = 'Quanto tempo levou para ser atendido?';

UPDATE public.nps_question_bank SET options = '{"choices":["Familiares","Amigos","Colegas de trabalho","Nas redes sociais","Não recomendaria"]}'::jsonb
  WHERE is_global = true AND question_text = 'A quem você recomendaria nosso produto/serviço?';

UPDATE public.nps_question_bank SET options = '{"choices":["Comprador/Decisor","Usuário final","Financeiro","TI","Operacional","Outro"]}'::jsonb
  WHERE is_global = true AND question_text = 'Qual seu papel na empresa?';

UPDATE public.nps_question_bank SET options = '{"choices":["Menos de 6 meses","6 a 12 meses","1 a 3 anos","Mais de 3 anos"]}'::jsonb
  WHERE is_global = true AND question_text = 'Há quanto tempo é nosso cliente?';

UPDATE public.nps_question_bank SET options = '{"scale":5,"labels":["Muito difícil","Difícil","Neutro","Fácil","Muito fácil"]}'::jsonb
  WHERE is_global = true AND question_type = 'likert';
