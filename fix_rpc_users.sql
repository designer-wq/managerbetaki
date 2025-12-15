-- Script to update the get_auth_users_list RPC function
-- Run this in Supabase SQL Editor to fix missing user data and job titles

-- FIX: Drop the function first because the return type has changed
DROP FUNCTION IF EXISTS public.get_auth_users_list();

CREATE OR REPLACE FUNCTION public.get_auth_users_list()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  status text,
  avatar_url text,
  job_title_id uuid,
  job_title_name text,
  origin text,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    COALESCE(p.name, 'Usuário sem nome') as name,
    COALESCE(p.role, 'Visualizador') as role,
    COALESCE(p.status, 'active') as status,
    p.avatar_url,
    p.job_title_id,
    jt.name as job_title_name,
    p.origin,
    au.last_sign_in_at,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.job_titles jt ON p.job_title_id = jt.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_users_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_users_list() TO service_role;
