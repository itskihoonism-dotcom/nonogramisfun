import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기 | NONOGRAM IS FUN",
  robots: { index: false, follow: false },
};

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  return children;
}