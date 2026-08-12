import "./globals.css";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { createClient } from "../lib/supabaseServer";
import Footer from "../components/Footer"; 
import Script from "next/script";

export const metadata = {
  title: "NONOGRAM IS FUN - 노노그램은 정말 재밌어",
  description: "노노그램(네모로직)은 간단한 규칙과 도전적인 풀이로 두뇌를 자극하는 무료 논리 퍼즐입니다. 나만의 퍼즐을 만들고 공유해보세요.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  

  
  // 🌟 서버가 쿠키를 직접 읽어 사용자가 누구인지 선제 확인합니다!
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialUser = null;

  if (user && user.email) {
    const { data: userData } = await supabase
      .from("user_ids")
      .select("nickname, points, custom_id")
      .eq("email", user.email)
      .maybeSingle();

    const displayNickname = userData?.nickname || user.user_metadata?.nickname || "익명";
    const isAdmin = displayNickname === "주인장" || userData?.custom_id === "admin";
    const points = userData?.points || 0;

    initialUser = {
      nickname: displayNickname,
      points,
      isAdmin,
    };
  }

  // 🌟 서버가 공지사항 3개도 미리 가져옵니다!
  const { data: noticeData } = await supabase
    .from("notices")
    .select("id, title")
    .order("created_at", { ascending: false })
    .limit(3);

  const initialNotices = noticeData || [];

  return (
    <html lang="ko">
      <body style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
        margin: 0, 
        padding: 0, 
        backgroundColor: "#f5f6f7", 
        color: "#333", 
        display: "flex", 
        flexDirection: "column", 
        minHeight: "100vh" 
      }}>

        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4631511581907983" 
          crossOrigin="anonymous" 
          strategy="afterInteractive" 
        />

        
        {/* 상단 헤더 */}
        <header className="site-header" style={{ backgroundColor: "#222", color: "#fff", width: "100%", position: "sticky", top: 0, zIndex: 1000, boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>
          <div className="header-inner" style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", padding: "0 20px", height: "100px" }}>
            <Link href="/">
  <img 
    src="/logo.webp" 
    alt="로고" 
    className="header-logo" 
    width={150} 
    height={75} 
    style={{ cursor: "pointer", borderRadius: "10px", marginRight: "30px", objectFit: "contain" }}
  />
</Link>
            <nav className="header-nav" style={{ display: "flex", gap: "20px" }}>
              <Link href="/all-puzzles" style={{ color: "#fff", textDecoration: "none", fontSize: "15px", fontWeight: "bold", padding: "40px 0", transition: "all 0.2s" }}>
                창작노노그램
              </Link>
              <Link href="/community" style={{ color: "#fff", textDecoration: "none", fontSize: "15px", fontWeight: "bold", padding: "40px 0", transition: "all 0.2s" }}>
                커뮤니티
              </Link>
            </nav>
          </div>
        </header>

        {/* 본문 + 사이드바 컨테이너 */}
        <div className="layout-container" style={{ maxWidth: "1200px", margin: "20px auto", display: "flex", gap: "20px", padding: "0 20px", flex: 1, width: "100%", boxSizing: "border-box" }}>
          
          <main className="main-content" style={{ flex: 1, background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "30px", overflow: "hidden", minWidth: 0 }}>
            {children}
          </main>

          {/* 🌟 서버에서 완성된 유저/공지 데이터를 사이드바에 즉시 전달! */}
          <Sidebar initialUser={initialUser} initialNotices={initialNotices} />

        </div>
        <Footer />

      </body>
    </html>
  );
}