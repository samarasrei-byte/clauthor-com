
-- Table: lex_advogados
CREATE TABLE public.lex_advogados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cpf text NOT NULL,
  oab_numero text NOT NULL,
  oab_estado text NOT NULL,
  whatsapp text NOT NULL,
  govbr_login text NOT NULL,
  govbr_senha_encrypted text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lex_advogados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lex_advogados"
  ON public.lex_advogados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lex_advogados"
  ON public.lex_advogados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lex_advogados"
  ON public.lex_advogados FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lex_advogados"
  ON public.lex_advogados FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all lex_advogados"
  ON public.lex_advogados FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Table: lex_intimacoes
CREATE TABLE public.lex_intimacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advogado_id uuid NOT NULL REFERENCES public.lex_advogados(id) ON DELETE CASCADE,
  numero_processo text NOT NULL,
  tribunal text NOT NULL,
  tipo_ato text NOT NULL DEFAULT '',
  texto_resumo text NOT NULL DEFAULT '',
  data_publicacao date NOT NULL DEFAULT CURRENT_DATE,
  prazo_dias integer NOT NULL DEFAULT 15,
  data_limite date NOT NULL,
  status text NOT NULL DEFAULT 'novo',
  whatsapp_enviado boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lex_intimacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lex_intimacoes"
  ON public.lex_intimacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lex_advogados la
      WHERE la.id = advogado_id AND la.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all lex_intimacoes"
  ON public.lex_intimacoes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_lex_intimacoes_advogado ON public.lex_intimacoes(advogado_id);
CREATE INDEX idx_lex_intimacoes_data_limite ON public.lex_intimacoes(data_limite ASC);
CREATE INDEX idx_lex_advogados_user ON public.lex_advogados(user_id);
