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

const { data: existingVote } = await supabase
  .from("community_votes")
  .select("*")
  .eq("post_id", postId)
  .eq("user_id", userId)
  .maybeSingle();
    

  if (existingVote?.vote_type === type) {
    return alert(`이미 ${type === "like" ? "추천" : "비추천"}을 누르셨습니다.`);
  }

  let newLikes = likes;
  let newDislikes = dislikes;
  if (existingVote) {
    if (type === "like") { newLikes += 1; newDislikes = Math.max(0, newDislikes - 1); }
    else { newDislikes += 1; newLikes = Math.max(0, newLikes - 1); }
  } else {
    if (type === "like") newLikes += 1; else newDislikes += 1;
  }

  // 🌟 select 후 insert/update 하던 방식은 동시 클릭 시 중복 행이 생길 수 있어서
  // upsert(같은 post_id+user_id면 덮어쓰기)로 교체. DB의 유니크 제약과 짝을 이룬다.
  const { error } = await supabase
    .from("community_votes")
    .upsert(
      { post_id: postId, user_id: userId, vote_type: type },
      { onConflict: "post_id,user_id" }
    );


  if (error) {
    alert("투표 처리 중 오류가 발생했습니다: " + error.message);
    return;
  }

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