"use client";

import { createClient } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 🌟 TypeScript에게 "이제부터 postId와 hasPermission 두 개를 받을 거야!" 라고 정확히 알려줍니다.
export default function PostActions({ postId, hasPermission }: { postId: number; hasPermission: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?\n(삭제된 글과 사진은 복구할 수 없습니다.)")) return;

    // 1. 게시글 데이터베이스에서 첨부 이미지 + 본문 내용을 가져옵니다.
    const { data: post } = await supabase.from("community_posts").select("image, content").eq("id", postId).single();

    const filePaths: string[] = [];

    // 2. 첨부파일(image 컬럼)에서 경로 추출
    if (post?.image && post.image !== "null" && post.image !== "[]") {
      try {
        const imageUrls = JSON.parse(post.image);
        imageUrls.forEach((url: string) => {
          const path = url.split('community_images/')[1];
          if (path) filePaths.push(path);
        });
      } catch (e) {
        console.error("이미지 경로 파싱 에러:", e);
      }
    }

    // 3. 본문(content)에 직접 삽입된 이미지에서 경로 추출
    if (post?.content) {
      const regex = /<img[^>]+src="([^"]+)"/g;
      const marker = "community_images/";
      let match;
      while ((match = regex.exec(post.content)) !== null) {
        const idx = match[1].indexOf(marker);
        if (idx !== -1) filePaths.push(decodeURIComponent(match[1].slice(idx + marker.length)));
      }
    }

    // 4. 스토리지(버킷)에서 한 번에 청소


    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage.from("community_images").remove(filePaths);
      if (storageError) console.error("스토리지 이미지 청소 에러:", storageError);
    }

    // 5. 달려있는 모든 댓글을 삭제합니다 (고아 방지)
    await supabase.from("community_comments").delete().eq("post_id", postId);

    // 6. 마지막으로 게시글 본체를 삭제합니다.
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);

    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("게시글이 성공적으로 삭제되었습니다.");
      router.push("/community");
      router.refresh();
    }
  };

  // 🌟 권한이 없으면(false) 아무것도 그리지 않고(null) 숨김 처리합니다.
  if (!hasPermission) return null;

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Link href={`/community/edit/${postId}`} style={{ padding: "6px 14px", fontSize: "13px", background: "#f1f1f1", color: "#333", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>
        수정
      </Link>
      <button type="button" onClick={handleDelete} style={{ padding: "6px 14px", fontSize: "13px", background: "#f44336", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
        삭제
      </button>
    </div>
  );
}
