import { createClient } from "../../lib/supabaseServer";
import Link from "next/link";
import SearchBox from "../../components/SearchBox";
import Pagination from "../../components/Pagination";
import KakaoAd from "../../components/KakaoAd";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: any;
}): Promise<Metadata> {
  const resolved = await Promise.resolve(searchParams);
  const page = Number(resolved?.page) || 1;

  return {
    title: "커뮤니티 | NONOGRAM IS FUN",
    description: "노노그램 유저들과 팁을 공유하고 소통해보세요.",
    // 🌟 2페이지 이후는 중복/저가치 콘텐츠로 분류될 수 있어 색인 제외
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
  };
}


const POSTS_PER_PAGE = 10;

export default async function CommunityPage({ searchParams }: { searchParams: any }) {
  const supabase = await createClient();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const keyword = resolvedSearchParams?.q || "";
  const currentPage = Number(resolvedSearchParams?.page) || 1;
  
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE - 1;

  let notices: any[] = [];
  let populars: any[] = [];
  let regulars: any[] = [];
  let totalCount = 0;

  if (keyword) {
    const { data, count, error } = await supabase
      .from("community_posts")
      .select("id, category, title, author, created_at, views, likes, comments, is_notice, image, content", { count: "exact" })
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
      .order("created_at", { ascending: false })
      .range(start, end);
    
    if (error) console.error("🚨 검색 데이터 불러오기 에러:", error);
    
    regulars = data || [];
    totalCount = count || 0;
  } else {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [noticesRes, popularsRes, regularsRes] = await Promise.all([
      supabase.from("community_posts").select("id, category, title, author, created_at, views, likes, comments, is_notice, image, content").eq("is_notice", true).order("created_at", { ascending: false }).limit(3),
      supabase.from("community_posts").select("id, category, title, author, created_at, views, likes, comments, is_notice, image, content").eq("is_notice", false).gte("created_at", oneWeekAgo).order("likes", { ascending: false }).limit(3),
      supabase.from("community_posts").select("id, category, title, author, created_at, views, likes, comments, is_notice, image, content", { count: "exact" }).order("created_at", { ascending: false }).range(start, end)
    ]);
    
    if (regularsRes.error) console.error("🚨 일반 게시글 불러오기 에러:", regularsRes.error);

    notices = noticesRes.data || [];
    populars = popularsRes.data || [];
    regulars = regularsRes.data || [];
    totalCount = regularsRes.count || 0;
  }

  // 🌟 24시간 이내 작성글은 'N시간 전' / 'N분 전'으로 표시하는 기능 추가!
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24 && now.getDate() === d.getDate()) {
      if (diffMins < 60) return diffMins <= 0 ? "방금 전" : `${diffMins}분 전`;
      return `${diffHours}시간 전`;
    }
    
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const renderPostRow = (post: any, type: "notice" | "popular" | "regular", index: number) => {
    let badge;
    if (type === "notice") badge = <span style={{ background: "#d97706", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>공지</span>;
    else if (type === "popular") badge = <span style={{ background: "#dc2626", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>인기</span>;
    else {
      const virtualNum = totalCount - ((currentPage - 1) * POSTS_PER_PAGE) - index;
      badge = <span style={{ color: "#888", fontSize: "13px", fontWeight: "bold" }}>{virtualNum}</span>;
    }

    const hasImageInContent = post.content && post.content.toLowerCase().includes("<img");
    const hasUploadedImage = post.image && post.image !== "[]" && post.image !== "null";
    
    // 🌟 첨부 아이콘도 찌그러지지 않게 flexShrink: 0 추가
    const imageIcon = (hasImageInContent || hasUploadedImage) ? (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: "5px" }}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    ) : null;

    return (
      <li key={`${type}-${post.id}`}>
        <Link href={`/community/${post.id}`} className="post-row-link">
          <div className="col-badge">{badge}</div>
          <div className="col-cate" style={{ color: type === "notice" || post.category === "공지사항" ? "#f44336" : "" }}>{post.category}</div>
          
          {/* 🌟 핵심 수정: Flexbox를 이용해 제목은 잘리더라도 댓글 수는 영역을 절대 사수하게 만듭니다! */}
          <div className="col-title" style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
            {imageIcon}
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {post.title}
            </span>
            {post.comments > 0 && (
              <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "14px", marginLeft: "6px", flexShrink: 0 }}>
                [{post.comments}]
              </span>
            )}
          </div>
          
          <div className="col-author">{post.author === "주인장" ? "⚙️" : "👤"} {post.author}</div>
          <div className="col-date">{formatDate(post.created_at)}</div>
          <div className="col-views">{post.views || 0}</div>
          <div className="col-likes">👍 {post.likes || 0}</div>
        </Link>
      </li>
    );
  };

  return (
    <div className="view active">

      {/* 📢 기기별 맞춤 카카오 애드핏 광고   시작 */}
      {/* 📢 기기별 맞춤 카카오 애드핏 광고 */}
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <div className="ad-pc">
          <KakaoAd unit="DAN-61T83j6HkgDDyPRJ" width="728" height="90" />
        </div>

        <div className="ad-mobile">
          <KakaoAd unit="DAN-q2LTq4MFcYdFmszx" width="320" height="100" />
        </div>
      </div>
      {/* 📢 카카오 애드핏 광고 끝 */}

      <div className="header-title-bar"><h2>💬 자유 게시판</h2></div>
      
      



      <SearchBox />

      <div className="board-header">
        <div className="col-badge">번호</div>
        <div className="col-cate">분류</div>
        <div className="col-title" style={{ textAlign: "center" }}>제목</div>
        <div className="col-author">작성자</div>
        <div className="col-date">날짜</div>
        <div className="col-views">조회</div>
        <div className="col-likes">추천</div>
      </div>

      <ul className="post-list">
        {!keyword && notices.map((post, idx) => renderPostRow(post, "notice", idx))}
        {!keyword && populars.map((post, idx) => renderPostRow(post, "popular", idx))}
        {regulars.length === 0 ? (
          <li style={{ justifyContent: "center", color: "#999", padding: "40px 0" }}>{keyword ? "검색 결과가 없습니다." : "게시글이 없습니다."}</li>
        ) : (
          regulars.map((post, idx) => renderPostRow(post, "regular", idx))
        )}
      </ul>

      <Pagination totalCount={totalCount} postsPerPage={POSTS_PER_PAGE} />

      <div className="write-action-box">
        <Link href="/community/write" className="btn-write" style={{ display: "inline-block", textDecoration: "none" }}>
          ✍️ 글쓰기
        </Link>
      </div>
    </div>
  );
}