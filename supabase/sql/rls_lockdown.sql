-- ============================================================
-- RLS 잠금: Supabase 보안 경고(Table publicly accessible /
-- Sensitive data publicly accessible) 대응
-- Supabase SQL Editor에서 직접 실행 필요
--
-- 문제: community_comments, community_posts, community_votes,
-- completed_puzzles, notice_comments, puzzle_comments,
-- puzzle_dislikes, puzzle_likes, user_ids 9개 테이블이
-- RLS(Row Level Security)가 꺼져있어서 비로그인 상태에서도
-- API로 직접 아무 데이터나 읽기/쓰기/삭제가 가능했음.
-- 특히 user_ids에는 이메일(개인정보)이 있어 더 심각했음.
--
-- 해결: 기존에 이미 RLS가 적용돼있던 puzzles/notices 테이블의
-- 정책 스타일에 맞춰서, 조회는 공개로 두고 작성/수정/삭제는
-- 로그인한 사용자만 가능하도록 제한. user_ids는 추가로
-- email 컬럼만 로그인 사용자에게만 보이도록 컬럼 단위로도 보호.
-- ============================================================

-- community_posts
alter table community_posts enable row level security;
create policy "누구나 조회 가능" on community_posts for select using (true);
create policy "로그인 유저만 작성 가능" on community_posts for insert to authenticated with check (true);
create policy "로그인 유저만 수정 가능" on community_posts for update to authenticated using (true) with check (true);
create policy "로그인 유저만 삭제 가능" on community_posts for delete to authenticated using (true);

-- community_comments
alter table community_comments enable row level security;
create policy "누구나 조회 가능" on community_comments for select using (true);
create policy "로그인 유저만 작성 가능" on community_comments for insert to authenticated with check (true);
create policy "로그인 유저만 수정 가능" on community_comments for update to authenticated using (true) with check (true);
create policy "로그인 유저만 삭제 가능" on community_comments for delete to authenticated using (true);

-- community_votes
alter table community_votes enable row level security;
create policy "누구나 조회 가능" on community_votes for select using (true);
create policy "로그인 유저만 작성 가능" on community_votes for insert to authenticated with check (true);
create policy "로그인 유저만 수정 가능" on community_votes for update to authenticated using (true) with check (true);
create policy "로그인 유저만 삭제 가능" on community_votes for delete to authenticated using (true);

-- notice_comments
alter table notice_comments enable row level security;
create policy "누구나 조회 가능" on notice_comments for select using (true);
create policy "로그인 유저만 작성 가능" on notice_comments for insert to authenticated with check (true);
create policy "로그인 유저만 수정 가능" on notice_comments for update to authenticated using (true) with check (true);
create policy "로그인 유저만 삭제 가능" on notice_comments for delete to authenticated using (true);

-- puzzle_comments
alter table puzzle_comments enable row level security;
create policy "누구나 조회 가능" on puzzle_comments for select using (true);
create policy "로그인 유저만 작성 가능" on puzzle_comments for insert to authenticated with check (true);
create policy "로그인 유저만 수정 가능" on puzzle_comments for update to authenticated using (true) with check (true);
create policy "로그인 유저만 삭제 가능" on puzzle_comments for delete to authenticated using (true);

-- puzzle_likes
alter table puzzle_likes enable row level security;
create policy "누구나 조회 가능" on puzzle_likes for select using (true);
create policy "로그인 유저만 작성 가능" on puzzle_likes for insert to authenticated with check (true);
create policy "로그인 유저만 삭제 가능" on puzzle_likes for delete to authenticated using (true);

-- puzzle_dislikes
alter table puzzle_dislikes enable row level security;
create policy "누구나 조회 가능" on puzzle_dislikes for select using (true);
create policy "로그인 유저만 작성 가능" on puzzle_dislikes for insert to authenticated with check (true);
create policy "로그인 유저만 삭제 가능" on puzzle_dislikes for delete to authenticated using (true);

-- completed_puzzles
alter table completed_puzzles enable row level security;
create policy "누구나 조회 가능" on completed_puzzles for select using (true);
create policy "로그인 유저만 작성 가능" on completed_puzzles for insert to authenticated with check (true);

-- user_ids (가장 중요: 이메일 컬럼 보호)
alter table user_ids enable row level security;
create policy "누구나 조회 가능" on user_ids for select using (true);
create policy "누구나 가입 가능" on user_ids for insert with check (true);
create policy "본인만 수정 가능" on user_ids for update to authenticated using (auth.email() = email) with check (auth.email() = email);
create policy "본인만 삭제 가능" on user_ids for delete to authenticated using (auth.email() = email);

-- 컬럼 단위 보호: 닉네임/포인트/관리자여부는 누구나 조회 가능(뱃지 표시용),
-- 이메일은 로그인한 사용자만 조회 가능
revoke select on user_ids from anon, authenticated;
grant select (nickname, points, custom_id) on user_ids to anon, authenticated;
grant select (email) on user_ids to authenticated;
grant insert, update, delete on user_ids to anon, authenticated;
grant select, insert, update, delete on community_posts, community_comments, community_votes, notice_comments, puzzle_comments, puzzle_likes, puzzle_dislikes, completed_puzzles to anon, authenticated;

-- ============================================================
-- 확인용: 전부 true로 나와야 정상
-- ============================================================
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
