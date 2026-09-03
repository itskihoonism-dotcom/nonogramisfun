"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabaseClient";
import PostActions from "./PostActions";

export default function PostPermissionActions({ postId, postAuthor }: { postId: number; postAuthor: string }) {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
      const nickname = userData?.nickname || user.user_metadata?.nickname || "";
      const isAdmin = nickname === "주인장" || userData?.custom_id === "admin";
      setHasPermission(isAdmin || nickname === postAuthor);
    };
    check();
  }, [postAuthor]);

  return <PostActions postId={postId} hasPermission={hasPermission} />;
}