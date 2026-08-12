"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabaseClient";

export default function MainClientArea() {
  const router = useRouter();
  const supabase = createClient();

  const handleMakePuzzleClick = async () => {
    // 🌟 getSession() 대신, 더 확실하게 현재 유저를 확인하는 getUser()로 변경!
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("로그인 후 이용할 수 있습니다!");
    } else {
      router.push("/make-puzzle");
    }
  };

  return (
    <div style={{ textAlign: "center", marginBottom: "30px" }}>
      <button 
        onClick={handleMakePuzzleClick}
        style={{ padding: "10px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}
      >
        + 직접 퍼즐 만들기
      </button>
    </div>
  );
}