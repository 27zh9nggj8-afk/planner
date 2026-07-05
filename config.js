/* =====================================================
   학점은행 플래너 — 서버 설정 (로그인 · 클라우드 저장)

   로그인/기기 간 동기화를 켜려면 Supabase 무료 프로젝트를 만들고
   아래 두 값을 채워 주세요. 비워두면 로그인 없이
   이 기기(localStorage)에만 저장되는 기본 모드로 동작합니다.

   설정 방법 (약 5분):
   1. https://supabase.com 가입 → New Project 생성
   2. Project Settings → API 에서
      - Project URL  → SUPABASE_URL 에 붙여넣기
      - anon public key → SUPABASE_ANON_KEY 에 붙여넣기
   3. SQL Editor에서 아래 쿼리 실행 (저장 테이블 + 본인만 접근 가능한 보안 규칙):

      create table public.planner_states (
        user_id uuid primary key references auth.users(id) on delete cascade,
        data jsonb not null,
        updated_at timestamptz not null default now()
      );
      alter table public.planner_states enable row level security;
      create policy "own state" on public.planner_states
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

   4. Authentication → Providers → Email 활성화
      (개발 중에는 Confirm email 끄면 가입 즉시 로그인됩니다)
   5. 앱을 http(s) 서버로 열기 — file:// 로는 로그인이 동작하지 않아요.
      로컬 테스트:  python3 -m http.server 8000  →  http://localhost:8000
   ===================================================== */

/* ---------- 프리미엄(1회 결제) 판매 설정 ----------
   계좌 정보를 채우면 앱의 '프리미엄' 화면에 입금 안내가 표시됩니다.

   [입금 확인 후 프리미엄 켜주는 방법]
   Supabase → SQL Editor에서 (아이디 부분만 바꿔서) 실행:
     insert into public.premium_users (user_id)
     select id from auth.users where email = '아이디@cbp-user.app'
     on conflict do nothing;
   사용자는 앱을 새로고침하면 바로 프리미엄이 켜져요. */

const CONFIG = {
  PREMIUM: {
    price: 9900,
    bank: '',      // 예: '카카오뱅크'
    account: '',   // 예: '3333-01-1234567'
    holder: ''     // 예: '홍길동'
  },
  SUPABASE_URL: 'https://rchopnosohtvbyrjfyin.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaG9wbm9zb2h0dmJ5cmpmeWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzI3NTksImV4cCI6MjA5ODc0ODc1OX0.YnlZk5R4S9oNKD4XekkmJwHz84dS0cOGPQCYPDqYEhc'
};
