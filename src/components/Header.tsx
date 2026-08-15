"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      {/* 모바일 햄버거 메뉴용 반응형 스타일 */}
      <style>{`
        .menu-toggle { display: none; flex-direction: column; justify-content: center; gap: 5px; width: 32px; height: 32px; background: none; border: none; cursor: pointer; padding: 0; margin-left: auto; }
        .menu-toggle span { display: block; width: 100%; height: 3px; background-color: #fff; border-radius: 2px; }

        @media (max-width: 768px) {
          .header-inner { padding: 0 12px; height: 60px; }
          .header-logo { height: 40px; margin-right: 0; }
          .menu-toggle { display: flex; }
          .header-nav {
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            flex-direction: column;
            gap: 0;
            background-color: #222;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.25s ease;
          }
          .header-nav.open { max-height: 300px; }
          .header-nav a { padding: 16px 20px; border-bottom: 1px solid #333; }
        }
      `}</style>

      <div className="header-inner">
        <Link href="/" onClick={closeMenu}>
          <img src="/logo.webp" alt="로고" className="header-logo" width={150} height={75} />
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label="메뉴 열기"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`header-nav${isMenuOpen ? " open" : ""}`}>
          <Link href="/all-puzzles" className="active" onClick={closeMenu}>창작노노그램</Link>
          <Link href="/community" onClick={closeMenu}>커뮤니티</Link>
        </nav>
      </div>
    </header>
  );
}