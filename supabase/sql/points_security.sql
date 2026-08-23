-- ============================================================
-- 포인트 해킹 방지 (Points Hacking Prevention)
-- Supabase SQL Editor에서 그대로 실행하세요.
--
-- 문제: 기존에는 클라이언트(브라우저)에서 직접
--   supabase.from("user_ids").update({ points: ... })
-- 를 호출해서 포인트를 지급했기 때문에, 브라우저 콘솔에서 누구나
-- 자기 points 값을 원하는 대로 바꿀 수 있었습니다.
--
-- 해결책:
--   1) user_ids.points 컬럼은 트리거로 보호해서, 서버 측에서
--      허용한 경우가 아니면 어떤 UPDATE가 와도 값이 그대로 유지되게 함.
--   2) 커뮤니티 글쓰기 시 50P를 지급하는 트리거를 community_posts에
--      INSERT 되는 순간 자동으로 실행 (SECURITY DEFINER로 실행되며,
--      이때만 points 보호를 잠깐 해제).
-- ============================================================

-- 1. points 컬럼 보호 트리거
create or replace function protect_points_column()
returns trigger
language plpgsql
as $$
begin
  if new.points is distinct from old.points then
    if coalesce(current_setting('app.allow_points_update', true), 'false') <> 'true' then
      new.points := old.points;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_points on user_ids;
create trigger trg_protect_points
before update on user_ids
for each row
execute function protect_points_column();

-- 2. 커뮤니티 글 작성 시 50P 자동 지급 트리거
create or replace function award_points_on_community_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_points_update', 'true', true);
  update user_ids
  set points = coalesce(points, 0) + 50
  where nickname = new.author;
  perform set_config('app.allow_points_update', 'false', true);
  return new;
end;
$$;

drop trigger if exists trg_award_points_community_post on community_posts;
create trigger trg_award_points_community_post
after insert on community_posts
for each row
execute function award_points_on_community_post();

-- ============================================================
-- 확인 방법:
--   1) 위 SQL 실행 후, 커뮤니티에 글을 하나 작성해보고
--      user_ids.points 가 정확히 +50 되는지 확인.
--   2) 브라우저 콘솔에서 아래처럼 직접 해킹을 시도해도
--      points 값이 바뀌지 않아야 정상입니다.
--        supabase.from("user_ids").update({ points: 999999 }).eq("email", "내이메일")
-- ============================================================
