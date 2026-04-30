-- Run this script in your Supabase Dashboard -> SQL Editor
-- This will create the authentication records for the seeded users so you can log in.

-- 1. Insert the Officer user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000001', 
  'authenticated', 
  'authenticated', 
  'officer@auditchain.dev', 
  crypt('password123', gen_salt('bf')), 
  NOW(), 
  '{"provider":"email","providers":["email"]}', 
  '{}', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert the Engineer user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000002', 
  'authenticated', 
  'authenticated', 
  'dev@auditchain.dev', 
  crypt('password123', gen_salt('bf')), 
  NOW(), 
  '{"provider":"email","providers":["email"]}', 
  '{}', 
  NOW(), 
  NOW()
)
ON CONFLICT DO NOTHING;

-- 4. Insert identities for Engineer
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002', 
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000002', 'dev@auditchain.dev')::jsonb, 
  'email', 
  NOW(), 
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Insert the Auditor user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000003', 
  'authenticated', 
  'authenticated', 
  'auditor@external.com', 
  crypt('password123', gen_salt('bf')), 
  NOW(), 
  '{"provider":"email","providers":["email"]}', 
  '{}', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert identities for Auditor
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003', 
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000003', 'auditor@external.com')::jsonb, 
  'email', 
  NOW(), 
  NOW()
)
ON CONFLICT DO NOTHING;

