"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function NoticeDeleteButton({ noticeId, content }: { noticeId: string; content: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const regex = /<img[^>]+src="([^"]+)"/g;
    const marker = "/storage/v1/object/public/community_images/";
    const paths: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const idx = match[1].indexOf(marker);
      if (idx !== -1) paths.push(decodeURIComponent(match[1].slice(idx + marker.length)));
    }
    if (paths.length > 0) {
      await supabase.storage.from("community_images").remove(paths);
    }

    const { error } = await supabase.from("notices").delete().eq("id", noticeId);
    if (error) {
      alert("삭제 실패: " + error.message);
      return;
    }

    alert("삭제되었습니다.");
    router.push("/notice");
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      style={{ padding: "6px 16px", background: "#f44336", color: "#fff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
    >
      삭제
    </button>
  );
}