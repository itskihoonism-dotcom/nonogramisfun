export const metadata = {
  title: "퍼즐 만들기 | NONOGRAM IS FUN",
};

export default function MakePuzzleLayout({ children }: { children: React.ReactNode }) {
  // children은 아까 수정한 page.tsx 화면을 그대로 쏙 집어넣는 역할을 합니다.
  return <>{children}</>;
}