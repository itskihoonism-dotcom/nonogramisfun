"use client";
import LevelBadge, { getLevel } from "./LevelBadge";

export default function AuthorBadge({ author, info }: { author: string; info?: { points: number; isAdmin: boolean } }) {
  if (!info) return <>{author}</>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <LevelBadge level={getLevel(info.points)} isAdmin={info.isAdmin} size="sm" />
      {author}
    </span>
  );
}