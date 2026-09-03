"use client";

import Link from "next/link";
import Image from "next/image"; 
import { usePathname } from "next/navigation";
import { useMobileMenu } from "./MobileMenuContext";

export default function Header() {
  const { setOpen } = useMobileMenu();
  const pathname = usePathname();
  const isPuzzleActive = pathname.startsWith("/all-puzzles") || pathname.startsWith("/puzzle") || pathname.startsWith("/make-puzzle");
  const isCommunityActive = pathname.startsWith("/community");

  return (
    <header className="site-header">
      <style>{`
        .menu-toggle { display: none; flex-direction: column; justify-content: center; gap: 5px; width: 32px; height: 32px; background: none; border: none; cursor: pointer; padding: 0; margin-left: auto; }
        .menu-toggle span { display: block; width: 100%; height: 3px; background-color: #fff; border-radius: 2px; }

        @media (max-width: 850px) {
          .header-inner { padding: 0 12px; height: 60px; }
          .header-logo { height: 40px; width: auto; margin-right: 0; }
          .menu-toggle { display: flex; }
          .header-nav { display: none; }
        }
      `}</style>

      <div className="header-inner">
        <Link href="/">
          <Image src="/logo.webp" alt="로고" className="header-logo" width={150} height={75} priority />
        </Link>

        <nav className="header-nav">
          <Link href="/all-puzzles" className={isPuzzleActive ? "active" : ""}>창작노노그램</Link>
          <Link href="/community" className={isCommunityActive ? "active" : ""}>커뮤니티</Link>
        </nav>

        <button
          type="button"
          className="menu-toggle"
          aria-label="메뉴 열기"
          onClick={() => setOpen(true)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}