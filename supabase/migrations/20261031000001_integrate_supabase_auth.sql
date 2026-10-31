-- ==============================================================================
-- Migração Complementar: Integração Nativa com Supabase Auth
-- Data: 2026-10-31
-- Descrição: 
-- 1. Vincula public.users ao auth.users através do uid (UUID).
-- 2. Torna o campo password opcional/desnecessário em public.users (senhas seguras no auth).
-- 3. Cria gatilho automático para sincronizar novos usuários criados no painel 
--    do Supabase (Authentication > Users > Add user) diretamente na tabela de perfis.
-- ==============================================================================

-- 1. Ajustar o campo uid na tabela public.users para referenciar auth.users
DO $$
BEGIN
    -- Permitir que password seja nulo, pois as credenciais residem em auth.users
    ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;
    ALTER TABLE public.users ALTER COLUMN password SET DEFAULT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Vincular FK com auth.users se ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_auth_users'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT fk_users_auth_users 
        FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Função automática para sincronizar novos usuários do Supabase Auth
-- Quando você clica em "Authentication > Users > Add user" no painel,
-- este gatilho cria o perfil em public.users automaticamente!
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
    v_name TEXT;
    v_role TEXT;
    v_shift TEXT;
BEGIN
    -- Extrair metadados ou utilizar padrões baseados no e-mail
    v_username := LOWER(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)));
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', INITCAP(SPLIT_PART(NEW.email, '@', 1)));
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario');
    v_shift := COALESCE(NEW.raw_user_meta_data->>'shift', 'Plantão Geral');

    -- Inserir ou atualizar na tabela pública de perfis
    INSERT INTO public.users (uid, username, name, role, shift, active)
    VALUES (NEW.id, v_username, v_name, v_role, v_shift, TRUE)
    ON CONFLICT (username) DO UPDATE
    SET uid = EXCLUDED.uid,
        name = COALESCE(public.users.name, EXCLUDED.name),
        role = COALESCE(public.users.role, EXCLUDED.role);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar o gatilho na tabela auth.users
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. Atualizar perfis existentes do Anderson e da Claudilene com seus UIDs
UPDATE public.users 
SET uid = '9db4fbd7-a56c-4568-91e0-be48df59d5e7', password = NULL
WHERE username = 'anderson';

UPDATE public.users 
SET uid = '73bc8b97-ea6e-44d4-a957-35c8b908d907', password = NULL
WHERE username = 'claudilene';
