import NoticeDeleteButton from "../../../components/NoticeDeleteButton";
import { createClient } from "../../../lib/supabaseServer";
import Link from "next/link";
import NoticeCommentSection from "../../../components/NoticeCommentSection";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: notice } = await supabase.from("notices").select("*").eq("id", id).single();
  if (!notice) notFound();

  await supabase.from("notices").update({ views: (notice.views || 0) + 1 }).eq("id", id);

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user?.email) {
    const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
    isAdmin = userData?.nickname === "주인장" || userData?.custom_id === "admin";
  }

  const { data: comments } = await supabase.from("notice_comments").select("*").eq("notice_id", id).order("created_at", { ascending: true });

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="view active">
      <div className="header-title-bar">
        <Link href="/notice" className="header-btn back" style={{ display: "inline-block", textDecoration: "none" }}>❮ 목록으로</Link>
        <span style={{ fontSize: "14px", color: "#888" }}>공지사항</span>
      </div>

      <div className="read-header-area">
        <h1 className="read-title">{notice.title}</h1>
        <div className="read-meta-box">
          <div className="read-avatar">⚙️</div>
          <div className="read-meta-text">
            <span className="read-author">주인장</span>
            <span className="read-time-views">{formatDate(notice.created_at)} | 조회수 {(notice.views || 0) + 1}</span>
          </div>
        </div>
      </div>

      <div className="read-content ql-editor" style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: notice.content }} />

      {isAdmin && (
        <div className="read-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderBottom: "1px solid #eee", padding: "15px 0" }}>
          <Link href={`/notice/edit/${notice.id}`} style={{ padding: "6px 16px", background: "#2196F3", color: "#fff", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>수정</Link>
          <NoticeDeleteButton noticeId={notice.id} content={notice.content} />
        </div>
      )}

      <NoticeCommentSection noticeId={notice.id} initialComments={comments || []} />
    </div>
  );
}