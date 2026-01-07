-- Criar função para gerar hash SHA-256 de senhas
-- Esta função permite inserir senhas em texto plano e o banco gera o hash automaticamente

-- Função para gerar hash SHA-256
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- PostgreSQL usa pgcrypto para hash SHA-256
    -- Se pgcrypto não estiver instalado, use encode + digest
    RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentário na função
COMMENT ON FUNCTION public.hash_password(TEXT) IS 'Gera hash SHA-256 de uma senha em texto plano';

-- Exemplo de uso:
-- SELECT hash_password('minha_senha');
-- Retorna: hash SHA-256 da senha

