import { createClient } from "@/lib/supabaseServer"; // 🌟 서버용 클라이언트로 교체!
import Link from "next/link";
import VoteButtons from "../../../components/VoteButtons";
import CommentSection from "../../../components/CommentSection";
import PostActions from "../../../components/PostActions";
import KakaoAd from "../../../components/KakaoAd";
import ShareButton from "../../../components/ShareButton";
import { sanitizeContent } from "@/lib/sanitize";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorBadgeMap, getLevel } from "@/lib/levelUtils";
import LevelBadge from "@/components/LevelBadge";
import { cache } from "react"; // 

const SITE_NAME = "NONOGRAM IS FUN";
const SITE_URL = "https://nonogramisfun.com";





// generateMetadata와 페이지 본문에서 각각 호출해도 DB 쿼리는 1회만 실행됩니다.
const getPost = cache(async (postId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .single();
  return data;
});

function toDescription(html: string | null): string {
  if (!html) return "";
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ") // 태그 제거
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
 
  if (!text) return "";
  return text.length > 155 ? `${text.slice(0, 155)}…` : text;
}




function firstImage(raw: string | null): string | undefined {
  if (!raw || raw === "null" || raw === "[]") return undefined;
  try {
    const arr: string[] = JSON.parse(raw);
    return arr[0];
  } catch {
    return undefined;
  }
}



 
// ✅ [추가 5] 페이지별 메타데이터 생성 — 이게 핵심입니다
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
 
  if (!post) {
    return {
      title: `게시글을 찾을 수 없습니다 | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }
 
  const description =
    toDescription(post.content) ||
    `${SITE_NAME} 커뮤니티에 ${post.author}님이 올린 글입니다.`;
  const url = `${SITE_URL}/community/${post.id}`;
  const ogImage = firstImage(post.image);
 
  return {
    title: `${post.title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: post.created_at,
      authors: post.author ? [post.author] : undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: post.title,
      description,
    },
  };
}
 

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient(); // 🌟 새로운 클라이언트 활성화
  
  const resolvedParams = await params;
  const postId = resolvedParams.id;

  // 1. 유저 권한 및 정보 가져오기 🌟 (핵심 추가 부분)
  const { data: { user } } = await supabase.auth.getUser();
  let currentUserNickname = "";
  let isAdmin = false;
  
  if (user && user.email) {
    const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
    currentUserNickname = userData?.nickname || user.user_metadata?.nickname || "";
    isAdmin = currentUserNickname === "주인장" || userData?.custom_id === "admin";
  }

  // ✅ [수정 6] 캐싱된 getPost 재사용 (기존 인라인 쿼리 삭제)
  const post = await getPost(postId);
  
  // ✅ [수정 7] 소프트 404 제거 — notFound()로 실제 404 상태코드 반환
  if (!post) notFound();

  // 3. 조회수 증가 및 댓글 가져오기
  await supabase.from("community_posts").update({ views: (post.views || 0) + 1 }).eq("id", postId);
  const { data: comments } = await supabase.from("community_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 🌟 현재 유저가 작성자 본인이거나 관리자인지 확인! (Boolean으로 꽉 묶어줍니다)
  const hasPermission = Boolean(isAdmin || (currentUserNickname !== "" && currentUserNickname === post.author));


    const authorInfoMap = await getAuthorBadgeMap(supabase, [post.author]);
  const authorInfo = authorInfoMap[post.author];


  return (
    <div className="view active">

            <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <div className="ad-pc">
                <KakaoAd unit="DAN-61T83j6HkgDDyPRJ" width="728" height="90" />
              </div>
      
              <div className="ad-mobile">
                <KakaoAd unit="DAN-q2LTq4MFcYdFmszx" width="320" height="100" />
              </div>
            </div>
            {/* 📢 카카오 애드핏 광고 끝 */}

      <div className="header-title-bar">
        <Link href="/community" className="header-btn back" style={{ display: "inline-block", textDecoration: "none" }}>❮ 목록으로</Link>
        <span style={{ fontSize: "14px", color: "#888" }}>자유 게시판</span>
      </div>
      
      <div className="read-header-area">
        <h1 className="read-title">{post.title}</h1>
        <div className="read-meta-box">
          <div className="read-avatar" style={{ background: "none" }}>
            {authorInfo ? <LevelBadge level={getLevel(authorInfo.points)} isAdmin={authorInfo.isAdmin} /> : (post.author === "주인장" ? "⚙️" : "👤")}
          </div>
          <div className="read-meta-text">
            <span className="read-author">{post.author}</span>
            <span className="read-time-views">{formatDate(post.created_at)} | 조회수 {post.views + 1} | 👍 {post.likes || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="read-content ql-editor" dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }} />

      {post.image && post.image !== "null" && post.image !== "[]" && (
        <div className="attached-images" style={{ padding: "20px 0", borderTop: "1px dashed #eee", marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ fontSize: "13px", color: "#888", fontWeight: "bold", marginBottom: "5px" }}>📸 첨부 이미지</div>
          {(() => {
            try {
              const images: string[] = JSON.parse(post.image);
              return images.map((url, index) => (
                <img key={index} src={url} alt={`${post.title} 첨부 이미지 ${index + 1}`} style={{ maxWidth: "100%", borderRadius: "8px", border: "1px solid #ddd" }} />
              ));
            } catch (e) {
              return null;
            }
          })()}
        </div>
      )}

      <div className="read-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "15px 0" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <VoteButtons postId={post.id} initialLikes={post.likes} initialDislikes={post.dislikes} />
          <ShareButton title={post.title} url={`${SITE_URL}/community/${post.id}`} />
        </div>

        {/* 🌟 4. PostActions 컴포넌트에 권한(hasPermission)을 전달합니다! */}
        <PostActions postId={post.id} hasPermission={hasPermission} />
      </div>

      <CommentSection postId={post.id} initialComments={comments || []} commentCount={post.comments || 0} />
    </div>
  );
}