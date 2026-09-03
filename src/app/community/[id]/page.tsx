import { createClient } from "@/lib/supabaseServer"; // 🌟 서버용 클라이언트로 교체!
import Link from "next/link";
import VoteButtons from "../../../components/VoteButtons";
import CommentSection from "../../../components/CommentSection";
import KakaoAd from "../../../components/KakaoAd";
import ShareButton from "../../../components/ShareButton";
import { sanitizeContent } from "@/lib/sanitize";
import PostPermissionActions from "@/components/PostPermissionActions";
import CommunityViewStats from "@/components/CommunityViewStats";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorBadgeMap, getLevel } from "@/lib/levelUtils";
import LevelBadge from "@/components/LevelBadge";
import { cache } from "react";  
import Image from "next/image";

const SITE_NAME = "NONOGRAM IS FUN";
const SITE_URL = "https://nonogramisfun.com";

export const revalidate = 30;





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

  // 서로 독립적인 조회 두 개를 한 번에 실행 (조회수/권한 체크는 이제 클라이언트에서 처리)
  const [post, { data: comments }] = await Promise.all([
    getPost(postId),
    supabase.from("community_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true }),
  ]);

  if (!post) notFound();

  const authorInfoMap = await getAuthorBadgeMap(supabase, [post.author]);
  const authorInfo = authorInfoMap[post.author];

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };


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
            <span className="read-time-views">{formatDate(post.created_at)} | <CommunityViewStats postId={post.id} initialViews={post.views || 0} /> | 👍 {post.likes || 0}</span>
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
                <img key={index} src={url} alt={`${post.title} 첨부 이미지 ${index + 1}`} width={800} height={600} style={{ width: "100%", height: "auto", borderRadius: "8px", border: "1px solid #ddd" }} />
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

        <PostPermissionActions postId={post.id} postAuthor={post.author} />
      </div>

      <CommentSection postId={post.id} initialComments={comments || []} commentCount={post.comments || 0} />
    </div>
  );
}