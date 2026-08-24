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
