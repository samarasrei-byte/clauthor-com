
-- =============================================
-- FIX 1: Proteger waitlist contra leitura pública
-- Revogar acesso direto do anon role (belt-and-suspenders)
-- =============================================
REVOKE SELECT, UPDATE, DELETE ON public.waitlist FROM anon;

-- Manter apenas INSERT para anon (necessário para cadastro na waitlist)
GRANT INSERT ON public.waitlist TO anon;

-- =============================================
-- FIX 2: Restringir SELECT na tabela profiles
-- Revogar acesso direto do anon role
-- =============================================
REVOKE ALL ON public.profiles FROM anon;

-- Garantir que apenas authenticated pode acessar (RLS ainda aplica)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- =============================================
-- FIX 3: Preparar para criptografia server-side
-- Habilitar pgcrypto para funções de hash/encrypt
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
