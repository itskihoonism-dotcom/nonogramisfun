-- ============================================================
-- DB 인덱스 점검 및 추가
-- PK(기본키) 인덱스만 있고, 실제 코드에서 자주 필터링하는 컬럼엔
-- 인덱스가 없어서 추가함. 기존 데이터/서비스에 영향 없는 안전한 작업.
-- ============================================================

-- 로그인/관리자 체크(.eq("email", ...)), 작성자 뱃지 조회(.eq("nickname", ...))에
-- 거의 모든 페이지에서 쓰이는데 인덱스가 없었음 (우선순위 가장 높음)
create index if not exists idx_user_ids_email on user_ids (email);
create index if not exists idx_user_ids_nickname on user_ids (nickname);

-- 댓글 수 집계 / 댓글 목록 조회 (상세 페이지, 목록의 [N] 표시)
create index if not exists idx_community_comments_post_id on community_comments (post_id);
create index if not exists idx_puzzle_comments_puzzle_id on puzzle_comments (puzzle_id);
create index if not exists idx_notice_comments_notice_id on notice_comments (notice_id);

-- 창작퍼즐 목록에서 "내가 푼 퍼즐" 체크 (user_id 단독 조회, 기존 복합 유니크 인덱스는
-- puzzle_id가 선두 컬럼이라 이 조회엔 도움이 안 됐음)
create index if not exists idx_completed_puzzles_user_id on completed_puzzles (user_id);

-- 작성자 뱃지 매핑용
create index if not exists idx_puzzles_author on puzzles (author);

-- ============================================================
-- 확인용 쿼리
-- ============================================================
-- select tablename, indexname from pg_indexes
-- where schemaname = 'public' and indexname like 'idx_%'
-- order by tablename;
