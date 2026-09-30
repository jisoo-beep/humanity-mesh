import 'server-only'
import { createClient } from '@supabase/supabase-js'

function createSupabase() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createClient(url, serviceRoleKey, {
    db: { schema: 'storytech' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

let client: ReturnType<typeof createSupabase> | null = null

// service_role 키는 RLS를 우회하므로 서버에서만 사용한다. 빌드 시 환경변수 누락으로 실패하지 않도록 지연 생성.
export function getSupabase() {
  client ??= createSupabase()
  return client
}
