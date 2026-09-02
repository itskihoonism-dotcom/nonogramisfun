"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabaseClient";

export default function CommunityViewStats({
  postId,
  initialViews,
}: {
  postId: number;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);
  const firedRef = useRef(false);

  useEffect(() => {
    // React Strict Mode(개발 모드)에서 mount→unmount→mount가 두 번 일어나
    // effect가 두 번 실행되는 것을 막기 위한 가드. 이게 없으면 조회수가 2씩 오름.
    if (firedRef.current) return;
    firedRef.current = true;

    const run = async () => {
      const supabase = createClient();
      await supabase.rpc("increment_post_views", { p_post_id: postId });
      const { data } = await supabase
        .from("community_posts")
        .select("views")
        .eq("id", postId)
        .maybeSingle();
      if (typeof data?.views === "number") setViews(data.views);
    };
    run();
  }, [postId]);

  return <>조회수 {views}</>;
}
