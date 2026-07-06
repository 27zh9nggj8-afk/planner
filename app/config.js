/* =====================================================
   학점플래너 — 서버 설정 (로그인 · 결제 · 클라우드 저장)

   아래 두 값(SUPABASE_URL, SUPABASE_ANON_KEY)이 채워져 있으면
   앱은 '전면 유료' 모드로 동작합니다:
     회원가입 → 결제 안내(계좌이체) → 사장님이 12시간 이내 승인
     → 승인된 사용자만 앱 사용 가능
   두 값을 비워두면(로컬 개발용) 결제 없이 전체 기능이 열립니다.

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

/* ---------- 결제(1회) 설정 — 모든 사용자에게 필수 ----------
   회원가입 직후 이 계좌 정보가 결제 안내 화면에 표시됩니다.

   [입금 확인 후 승인해주는 방법]
   손님이 앱에서 '확인 요청'을 보내면 Supabase Table Editor의
   premium_requests 테이블에 아이디·입금자명이 쌓입니다.
   입금 내역과 대조한 뒤, SQL Editor에서 (아이디만 바꿔서) 실행:
     insert into public.premium_users (user_id)
     select id from auth.users where email = '아이디@cbp-user.app'
     on conflict do nothing;
   사용자는 앱에서 '승인됐는지 확인하기'를 누르면 바로 이용할 수 있어요. */

const CONFIG = {
  PREMIUM: {
    price: 9900,
    bank: '토스뱅크',
    account: '1000-5362-9733',
    holder: '최수인'
  },
  VAPID_PUBLIC_KEY: 'BL6fOpO05WSVlZ3O2rAr8a3vvUTovl6N_vvd26XIeJfMciEf9JttGXdp1sEEv8U0RFaSAEM95qwWnhL9tRYtvf0',  // 서버 푸시 알림용 공개키

  SUPABASE_URL: 'https://rchopnosohtvbyrjfyin.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaG9wbm9zb2h0dmJ5cmpmeWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzI3NTksImV4cCI6MjA5ODc0ODc1OX0.YnlZk5R4S9oNKD4XekkmJwHz84dS0cOGPQCYPDqYEhc'
};
