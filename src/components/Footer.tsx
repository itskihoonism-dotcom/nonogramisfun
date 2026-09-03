"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <>
      {/* 🌟 Footer 전용 스타일 */}
      <style>{`
        .site-footer { background-color: #222; color: #aaa; padding: 25px 0; text-align: center; font-size: 13px; margin-top: auto; }
        .footer-links { margin-bottom: 15px; }
        .footer-links a, .footer-links button { background: none; border: none; color: #ddd; text-decoration: none; margin: 0 15px; cursor: pointer; font-weight: 500; font-size: 13px; transition: color 0.2s; padding: 0; display: inline-block; }
        .footer-links a:hover, .footer-links button:hover { color: #2196F3; text-decoration: underline; }
        .footer-copyright { color: #777; }
      `}</style>

      {/* 🌟 Footer 본체 */}
      <footer className="site-footer">
        <div className="footer-links">
          <Link href="/about">소개</Link> |
          <Link href="/terms">이용약관</Link> |
          <Link href="/privacy">개인정보처리방침</Link> |
          <Link href="/contact">문의하기</Link>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} NONOGRAM IS FUN. All rights reserved.
        </div>
      </footer>
    </>
  );
}
