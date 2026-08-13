"use client"; // 🌟 클릭(상호작용)이 필요하므로 클라이언트 컴포넌트로 선언!

import { useState } from "react";
import { createClient } from "../lib/supabaseClient";

const supabase = createClient();

export default function VoteButtons({ postId, initialLikes, initialDislikes }: { postId: number, initialLikes: number, initialDislikes: number }) {
  const [likes, setLikes] = useState(initialLikes || 0);
  const [dislikes, setDislikes] = useState(initialDislikes || 0);

  const handleVote = async (type: "like" | "dislike") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("추천/비추천은 로그인한 회원만 이용할 수 있습니다.");

    const userId = session.user.id;

    // 1. 이미 투표했는지 확인
    const { data: existingVote } = await supabase
      .from("community_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    let newLikes = likes;
    let newDislikes = dislikes;

    if (existingVote) {
      if (existingVote.vote_type === type) {
        return alert(`이미 ${type === "like" ? "추천" : "비추천"}을 누르셨습니다.`);
      } else {
        if (type === "like") { newLikes += 1; newDislikes = Math.max(0, newDislikes - 1); } 
        else { newDislikes += 1; newLikes = Math.max(0, newLikes - 1); }
        await supabase.from("community_votes").update({ vote_type: type }).eq("id", existingVote.id);
      }
    } else {
      if (type === "like") newLikes += 1; else newDislikes += 1;
      await supabase.from("community_votes").insert([{ post_id: postId, user_id: userId, vote_type: type }]);
    }

    // 2. 화면 숫자 즉시 변경 및 DB 업데이트
    setLikes(newLikes);
    setDislikes(newDislikes);
    await supabase.from("community_posts").update({ likes: newLikes, dislikes: newDislikes }).eq("id", postId);
    
    alert(type === "like" ? "게시글을 추천했습니다! 👍" : "게시글을 비추천했습니다. 👎");
  };

  return (
    <div className="vote-box" style={{ display: "flex", gap: "10px" }}>
      <button onClick={() => handleVote("like")} style={{ background: "#fff", border: "1px solid #ff6d00", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", color: "#ff6d00" }}>
        👍 추천 <span>{likes}</span>
      </button>
      <button onClick={() => handleVote("dislike")} style={{ background: "#fff", border: "1px solid #999", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", color: "#555" }}>
        👎 비추천 <span>{dislikes}</span>
      </button>
    </div>
  );
}