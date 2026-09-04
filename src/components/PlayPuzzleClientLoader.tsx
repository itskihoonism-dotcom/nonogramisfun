"use client";

import dynamic from "next/dynamic";

const PlayPuzzleClient = dynamic(() => import("./PlayPuzzleClient"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "60px 0", textAlign: "center", color: "#999" }}>
      퍼즐을 불러오는 중...
    </div>
  ),
});

export default PlayPuzzleClient;