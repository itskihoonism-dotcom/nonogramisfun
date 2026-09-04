import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공지사항 작성 | NONOGRAM IS FUN",
  robots: { index: false, follow: false },
};

export default function NoticeWriteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
