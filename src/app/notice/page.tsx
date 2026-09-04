import { createClient } from "../../lib/supabaseServer";
import Link from "next/link";
import Pagination from "../../components/Pagination";
import KakaoAd from "../../components/KakaoAd";
import LevelBadge from "../../components/LevelBadge";
import type { Metadata } from "next";
import NoticeWriteButton from "../../components/NoticeWriteButton";

const SITE_URL = "https://nonogramisfun.com";

export const revalidate = 30;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: any;
}): Promise<Metadata> {
  const resolved = await Promise.resolve(searchParams);
  const page = Number(resolved?.page) || 1;

  return {
    title: "공지사항 | NONOGRAM IS FUN",
    alternates: { canonical: `${SITE_URL}/notice` },
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

const POSTS_PER_PAGE = 10;

export default async function NoticePage({ searchParams }: { searchParams: any }) {
  const supabase = await createClient();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const currentPage = Number(resolvedSearchParams?.page) || 1;

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE - 1;

const { data: notices, count } = await supabase
  .from("notices")
  .select("id, title, created_at, views, comments:notice_comments(count)", { count: "exact" })
  .order("created_at", { ascending: false })
  .range(start, end);

  const totalCount = count || 0;


const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const utcString = /Z$|[+-]\d{2}:?\d{2}$/.test(dateString) ? dateString : dateString + "Z";
  const kst = new Date(new Date(utcString).getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}.${String(kst.getUTCMonth() + 1).padStart(2, "0")}.${String(kst.getUTCDate()).padStart(2, "0")}`;
};

  return (
    <div className="view active">
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <div className="ad-pc">
          <KakaoAd unit="DAN-r7UxzhMfPVZQilVh" width="728" height="90" />
        </div>
        <div className="ad-mobile">
          <KakaoAd unit="DAN-8gBtol149cRHiI4x" width="320" height="100" />
        </div>
      </div>

<div className="header-title-bar">
  <h2 style={{ margin: 0, fontSize: "20px" }}>📢 공지사항</h2>
  <NoticeWriteButton />
</div>

      <div className="board-header">
        <div className="col-badge">번호</div>
        <div className="col-title" style={{ textAlign: "center" }}>제목</div>
        <div className="col-date">날짜</div>
        <div className="col-views">조회</div>
      </div>

      <ul className="post-list">
        {(!notices || notices.length === 0) ? (
          <li style={{ padding: "40px 0", textAlign: "center", color: "#999" }}>등록된 공지사항이 없습니다.</li>
        ) : (
          notices.map((n, idx) => {
  const commentCount = (n as any).comments?.[0]?.count || 0;
  return (
    <li key={n.id}>
      <Link href={`/notice/${n.id}`} className="post-row-link">
        <div className="col-badge" style={{ color: "#888", fontSize: "13px", fontWeight: "bold" }}>
          {totalCount - (start + idx)}
        </div>
        <div className="col-title" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", overflow: "hidden", width: "100%" }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</span>
            {commentCount > 0 && (
              <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "14px", marginLeft: "6px", flexShrink: 0 }}>
                [{commentCount}]
              </span>
            )}
          </div>
          <div className="post-meta-mobile">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><LevelBadge isAdmin size="sm" /> 주인장</span>
            <span>·</span>
            <span>{formatDate(n.created_at)}</span>
            <span>·</span>
            <span>조회 {n.views || 0}</span>
          </div>
        </div>

        <div className="col-date">{formatDate(n.created_at)}</div>
        <div className="col-views">{n.views || 0}</div>
      </Link>
    </li>
  );
}))}
      </ul>

      <Pagination totalCount={totalCount} postsPerPage={POSTS_PER_PAGE} basePath="/notice" />
    </div>
  );
}