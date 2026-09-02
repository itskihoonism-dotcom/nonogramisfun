"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabaseClient";

export default function PuzzleViewStats({
  puzzleId,
  initialViews,
}: {
  puzzleId: string;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    // React Strict Mode(개발 모드)에서 mount→unmount→mount가 두 번 일어나
    // effect가 두 번 실행되는 것을 막기 위한 가드. 이게 없으면 조회수가 2씩 오름.
    if (firedRef.current) return;
    firedRef.current = true;

    const run = async () => {
      const supabase = createClient();
      await supabase.rpc("increment_puzzle_views", { p_puzzle_id: puzzleId });
      const [{ data: puzzleRow }, { count: likeCount }] = await Promise.all([
        supabase.from("puzzles").select("views").eq("id", puzzleId).maybeSingle(),
        supabase
          .from("puzzle_likes")
          .select("*", { count: "exact", head: true })
          .eq("puzzle_id", puzzleId),
      ]);
      if (typeof puzzleRow?.views === "number") setViews(puzzleRow.views);
      setLikes(likeCount || 0);
    };
    run();
  }, [puzzleId]);

  return (
    <>
      조회수 {views} | 👍 {likes === null ? "…" : likes}
    </>
  );
}
