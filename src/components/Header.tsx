import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/">
          <Image src="/logo.webp" alt="로고" className="header-logo" width={150} height={75} priority />
        </Link>
        <nav className="header-nav">
          <Link href="/all-puzzles" className="active">창작노노그램</Link>
          <Link href="/community">커뮤니티</Link>
        </nav>
      </div>
    </header>
  );
}