"use client";

import dynamic from "next/dynamic";

const PlayPuzzleClient = dynamic(() => import("./PlayPuzzleClient"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 600, background: "#f0f0f0", borderRadius: 8 }} aria-hidden="true" />
  ),
});

export default PlayPuzzleClient;