-- Fix: video_generation_steps não estava na publication realtime,
-- fazendo a "Timeline ao vivo" nunca atualizar em tempo real.
ALTER TABLE public.video_generation_steps REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'video_generation_steps'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_generation_steps;
  END IF;
END $$;

-- Também garantir REPLICA IDENTITY FULL na tabela pai para UPDATE events completos.
ALTER TABLE public.video_generations REPLICA IDENTITY FULL;