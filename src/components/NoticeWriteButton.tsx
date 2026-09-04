"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabaseClient";

export default function NoticeWriteButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data: userData } = await supabase
        .from("user_ids")
        .select("nickname, custom_id")
        .eq("email", user.email)
        .maybeSingle();
      const admin = userData?.nickname === "주인장" || userData?.custom_id === "admin";
      setIsAdmin(admin);
    };
    check();
  }, []);

  if (!isAdmin) return null;
  return (
    <Link href="/notice/write" className="header-btn" style={{ textDecoration: "none" }}>+ 공지 작성</Link>
  );
}