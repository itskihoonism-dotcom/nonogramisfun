import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "퍼즐 설명 수정 | NONOGRAM IS FUN",
  robots: { index: false, follow: false },
};

export default function PuzzleEditLayout({ children }: { children: React.ReactNode }) {
  return children;
}