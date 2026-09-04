import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글 수정 | NONOGRAM IS FUN",
  robots: { index: false, follow: false },
};

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return children;
}