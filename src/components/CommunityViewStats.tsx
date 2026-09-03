"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabaseClient";

export default function CommunityViewStats({ postId, initialViews }: { postId: number; initialViews: number }) {
  const [views, setViews] = useState(initialViews);
  const firedRef = useRef(false); 

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    
    const run = async () => {
      const supabase = createClient();
      await supabase.rpc("increment_post_views", { p_post_id: postId });

      const { data } = await supabase.from("community_posts").select("views").eq("id", postId).maybeSingle();
      if (typeof data?.views === "number") setViews(data.views);
    };
    run();
  }, [postId]);

  return <>조회수 {views}</>;
}