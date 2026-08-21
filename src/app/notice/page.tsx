import { createClient } from "../../lib/supabaseServer";
import Link from "next/link";
import Pagination from "../../components/Pagination";
import KakaoAd from "../../components/KakaoAd";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "공지사항 | NONOGRAM IS FUN",
};

const POSTS_PER_PAGE = 10;

export default async function NoticePage({ searchParams }: { searchParams: any }) {
  const supabase = await createClient();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const currentPage = Number(resolvedSearchParams?.page) || 1;

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE - 1;

  const { data: notices, count } = await supabase
    .from("notices")
    .select("id, title, created_at, views", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(start, end);

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user?.email) {
    const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
    isAdmin = userData?.nickname === "주인장" || userData?.custom_id === "admin";
  }

  const totalCount = count || 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
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
        {isAdmin && (
          <Link href="/notice/write" className="header-btn" style={{ textDecoration: "none" }}>+ 공지 작성</Link>
        )}
      </div>

      <div className="board-header">
        <div className="col-badge">번호</div>
        <div className="col-title" style={{ textAlign: "center" }}>제목</div>
        <div className="col-author">작성자</div>
        <div className="col-date">날짜</div>
        <div className="col-views">조회</div>
      </div>

      <ul className="post-list">
        {(!notices || notices.length === 0) ? (
          <li style={{ padding: "40px 0", textAlign: "center", color: "#999" }}>등록된 공지사항이 없습니다.</li>
        ) : (
          notices.map((n, idx) => (
            <li key={n.id}>
              <Link href={`/notice/${n.id}`} className="post-row-link">
                <div className="col-badge" style={{ color: "#888", fontSize: "13px", fontWeight: "bold" }}>
                  {totalCount - (start + idx)}
                </div>
                <div className="col-title" style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</span>
                </div>
                <div className="col-author">⚙️ 주인장</div>
                <div className="col-date">{formatDate(n.created_at)}</div>
                <div className="col-views">{n.views || 0}</div>
              </Link>
            </li>
          ))
        )}
      </ul>

      <Pagination totalCount={totalCount} postsPerPage={POSTS_PER_PAGE} basePath="/notice" />
    </div>
  );
}