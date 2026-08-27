-- ============================================================
-- notices/puzzles 진짜 관리자·소유자 전용 잠금
-- Supabase SQL Editor에서 직접 실행 필요
--
-- 문제: notices/puzzles 테이블의 기존 정책은 이름만 "관리자만/
-- 로그인 전용"이고 실제로는 "로그인만 하면 아무나" 쓰기/수정/삭제가
-- 가능했음. 즉 일반 회원이 콘솔로 API를 직접 호출하면 가짜
-- 공지사항을 올리거나 남의 퍼즐을 수정/삭제할 수 있었음.
--
-- 해결: DB에서 실제 관리자 여부(is_admin) / 소유자 여부
-- (is_own_or_admin)를 확인하는 함수를 만들어서 정책에 적용.
-- 퍼즐 조회수 증가는 "수정" 권한이 필요 없는 별도의 안전한
-- 함수(increment_puzzle_views)로 분리해서, 소유자 제한과
-- 무관하게 누구나(비로그인 포함) 조회수를 올릴 수 있게 함.
-- ============================================================

-- 관리자 여부 확인 함수
create or replace function is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
  v_custom_id text;
begin
  select nickname, custom_id into v_nickname, v_custom_id
  from user_ids
  where email = auth.email();

  return coalesce(v_nickname = '주인장' or v_custom_id = 'admin', false);
end;
$$;

grant execute on function is_admin() to authenticated;

-- notices: 진짜 관리자만 작성/수정/삭제 가능
drop policy if exists "관리자만 등록 가능" on notices;
drop policy if exists "관리자만 삭제 가능" on notices;
drop policy if exists "관리자만 수정 가능" on notices;

create policy "관리자만 등록 가능" on notices for insert to authenticated with check (is_admin());
create policy "관리자만 삭제 가능" on notices for delete to authenticated using (is_admin());
create policy "관리자만 수정 가능" on notices for update to authenticated using (is_admin()) with check (is_admin());

-- 본인 소유이거나 관리자인지 확인하는 함수
create or replace function is_own_or_admin(p_author text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
begin
  if is_admin() then
    return true;
  end if;
  select nickname into v_nickname from user_ids where email = auth.email();
  return v_nickname = p_author;
end;
$$;

grant execute on function is_own_or_admin(text) to authenticated;

-- puzzles: 본인 또는 관리자만 수정/삭제 가능
drop policy if exists "Enable update for authenticated users only on puzzles" on puzzles;
drop policy if exists "Enable delete for authenticated users only on puzzles" on puzzles;

create policy "본인 또는 관리자만 수정 가능" on puzzles for update to authenticated using (is_own_or_admin(author)) with check (is_own_or_admin(author));
create policy "본인 또는 관리자만 삭제 가능" on puzzles for delete to authenticated using (is_own_or_admin(author));

-- 퍼즐 조회수 증가는 별도의 안전한 함수로 분리 (누구나 호출 가능, 비로그인 포함)
create or replace function increment_puzzle_views(p_puzzle_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update puzzles set views = coalesce(views, 0) + 1 where id = p_puzzle_id;
end;
$$;

grant execute on function increment_puzzle_views(bigint) to anon, authenticated;

-- ============================================================
-- 확인용
-- ============================================================
-- select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'notices' order by policyname;
-- select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'puzzles' order by policyname;
