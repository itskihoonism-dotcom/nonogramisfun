import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "퍼즐 만들기 | NONOGRAM IS FUN",
  robots: { index: false, follow: false },
};

export default function MakePuzzleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
