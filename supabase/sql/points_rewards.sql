-- ============================================================
-- 포인트 지급 시스템 확장 (공지사항에 적힌 나머지 6가지 활동)
-- ⚠️ points_security.sql 을 먼저 실행한 뒤에 이 SQL을 실행하세요.
-- Supabase SQL Editor에서 전체를 한 번에 복사해서 실행하면 됩니다.
-- ============================================================

-- 0. 공용 지급 장부: 같은 활동에 대해 중복 지급되는 걸 막는 역할
create table if not exists points_award_log (
  id bigint generated always as identity primary key,
  reason text not null,
  target_id text not null,
  recipient_email text not null,
  created_at timestamptz not null default now(),
  unique (reason, target_id, recipient_email)
);

-- 0-1. 공용 지급 함수: 이미 지급된 적 있으면 조용히 무시(중복 방지), 처음이면 지급
create or replace function try_award_points(p_reason text, p_target_id text, p_recipient_email text, p_points int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_id bigint;
begin
  if p_recipient_email is null then
    return false;
  end if;

  insert into points_award_log (reason, target_id, recipient_email)
  values (p_reason, p_target_id, p_recipient_email)
  on conflict (reason, target_id, recipient_email) do nothing
  returning id into v_new_id;

  if v_new_id is not null then
    perform set_config('app.allow_points_update', 'true', true);
    update user_ids set points = coalesce(points, 0) + p_points where email = p_recipient_email;
    perform set_config('app.allow_points_update', 'false', true);
    return true;
  end if;

  return false;
end;
$$;

-- ============================================================
-- 1. 로그인 50P (하루 1회)
-- Supabase Auth가 로그인마다 auth.users.last_sign_in_at을 갱신하는 걸 이용
-- ============================================================
create or replace function award_daily_login_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    perform try_award_points('daily_login', to_char(now(), 'YYYY-MM-DD'), new.email, 50);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_daily_login on auth.users;
create trigger trg_award_daily_login
after update on auth.users
for each row
execute function award_daily_login_points();

-- ============================================================
-- 2, 6. 퍼즐 완성(크기 비례, 퍼즐당 최초 1회) + 내 퍼즐을 다른 분이 완성(10P, 이용자당 1회)
-- completed_puzzles INSERT 시점에 두 가지를 한 번에 처리
-- ============================================================
create or replace function award_puzzle_completion_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_solver_email text;
  v_solver_nickname text;
  v_width int;
  v_height int;
  v_author text;
  v_author_email text;
  v_points int;
begin
  select email into v_solver_email from auth.users where id = new.user_id;
  if v_solver_email is null then return new; end if;

  select nickname into v_solver_nickname from user_ids where email = v_solver_email;

  select width, height, author into v_width, v_height, v_author from puzzles where id = new.puzzle_id;
  if v_width is null then return new; end if;

  v_points := round(v_width * v_height / 6.0);
  perform try_award_points('puzzle_complete', new.puzzle_id::text, v_solver_email, v_points);

  if v_author is not null and v_author is distinct from v_solver_nickname then
    select email into v_author_email from user_ids where nickname = v_author;
    if v_author_email is not null then
      perform try_award_points('puzzle_completed_by_other', new.puzzle_id::text || ':' || new.user_id::text, v_author_email, 10);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_award_puzzle_completion on completed_puzzles;
create trigger trg_award_puzzle_completion
after insert on completed_puzzles
for each row
execute function award_puzzle_completion_points();

-- ============================================================
-- 3. 퍼즐 제작 (크기 비례, 승인 시 지급)
-- 관리자 본인이 만들면 즉시 승인(INSERT 시 is_approved=true),
-- 일반 유저는 나중에 승인(UPDATE로 is_approved가 true로 바뀜) — 둘 다 처리
-- ============================================================
create or replace function award_puzzle_creation_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_points int;
begin
  if new.is_approved is true and (TG_OP = 'INSERT' or old.is_approved is distinct from true) then
    select email into v_email from user_ids where nickname = new.author;
    if v_email is not null then
      v_points := round(new.width * new.height / 6.0);
      perform try_award_points('puzzle_create_approved', new.id::text, v_email, v_points);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_puzzle_creation on puzzles;
create trigger trg_award_puzzle_creation
after insert or update on puzzles
for each row
execute function award_puzzle_creation_points();

-- ============================================================
-- 4. 커뮤니티 댓글 10P (게시글당 1회)
-- ============================================================
create or replace function award_community_comment_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from user_ids where nickname = new.author;
  if v_email is not null then
    perform try_award_points('community_comment', new.post_id::text, v_email, 10);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_community_comment on community_comments;
create trigger trg_award_community_comment
after insert on community_comments
for each row
execute function award_community_comment_points();

-- ============================================================
-- 5. 퍼즐 댓글 10P (퍼즐당 1회)
-- ============================================================
create or replace function award_puzzle_comment_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from user_ids where nickname = new.author;
  if v_email is not null then
    perform try_award_points('puzzle_comment', new.puzzle_id::text, v_email, 10);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_puzzle_comment on puzzle_comments;
create trigger trg_award_puzzle_comment
after insert on puzzle_comments
for each row
execute function award_puzzle_comment_points();

-- ============================================================
-- 7. 추천 받음 10P (대상당 1회 = 좋아요를 누른 사람 1명당 1회)
-- 커뮤니티 글: community_votes (INSERT/UPDATE로 like/dislike 전환)
-- 퍼즐: puzzle_likes (INSERT/DELETE로 좋아요 토글)
-- 둘 다 try_award_points의 유니크 키 덕분에 좋아요-취소-좋아요 반복해도 1회만 지급됨
-- ============================================================
create or replace function award_community_like_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author text;
  v_email text;
begin
  if new.vote_type = 'like' then
    select author into v_author from community_posts where id = new.post_id;
    if v_author is not null then
      select email into v_email from user_ids where nickname = v_author;
      if v_email is not null then
        perform try_award_points('community_like_received', new.post_id::text || ':' || new.user_id::text, v_email, 10);
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_community_like on community_votes;
create trigger trg_award_community_like
after insert or update on community_votes
for each row
execute function award_community_like_points();

create or replace function award_puzzle_like_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author text;
  v_email text;
begin
  select author into v_author from puzzles where id = new.puzzle_id;
  if v_author is not null then
    select email into v_email from user_ids where nickname = v_author;
    if v_email is not null then
      perform try_award_points('puzzle_like_received', new.puzzle_id::text || ':' || new.user_id::text, v_email, 10);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_puzzle_like on puzzle_likes;
create trigger trg_award_puzzle_like
after insert on puzzle_likes
for each row
execute function award_puzzle_like_points();

-- ============================================================
-- 확인용 쿼리: 트리거 8개가 전부 생성됐는지 확인
-- ============================================================
-- select tgname, tgenabled, tgrelid::regclass as table_name
-- from pg_trigger
-- where tgname like 'trg_award_%'
-- order by tgname;
