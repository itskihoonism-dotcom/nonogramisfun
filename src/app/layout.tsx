import "./globals.css";
import Sidebar from "../components/Sidebar";
import { createClient } from "../lib/supabaseServer";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Script from "next/script";
import { MobileMenuProvider } from "../components/MobileMenuContext";

export const metadata = {
  title: "NONOGRAM IS FUN - 노노그램은 정말 재밌어",
  description: "노노그램(네모로직)은 간단한 규칙과 도전적인 풀이로 두뇌를 자극하는 무료 논리 퍼즐입니다. 나만의 퍼즐을 만들고 공유해보세요.",
  icons: {
    icon: '/favicon.png', 
  },
  openGraph: {
    title: "NONOGRAM IS FUN - 노노그램은 정말 재밌어",
    description: "노노그램(네모로직)은 간단한 규칙과 도전적인 풀이로 두뇌를 자극하는 무료 논리 퍼즐입니다. 나만의 퍼즐을 만들고 공유해보세요.",
    url: "https://nonogramisfun.com",
    siteName: "NONOGRAM IS FUN",
    images: [
      {
        url: "https://jxwhdiwwgtnyyqenkpvw.supabase.co/storage/v1/object/public/NONOGRAM%20IS%20FUN/og.png",
        width: 800,
        height: 400,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NONOGRAM IS FUN - 노노그램은 정말 재밌어",
    description: "노노그램(네모로직)은 간단한 규칙과 도전적인 풀이로 두뇌를 자극하는 무료 논리 퍼즐입니다. 나만의 퍼즐을 만들고 공유해보세요.",
    images: ["https://jxwhdiwwgtnyyqenkpvw.supabase.co/storage/v1/object/public/NONOGRAM%20IS%20FUN/og.png"],
  },
  other: {
    "google-adsense-account": "ca-pub-4631511581907983",
  },
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
    let { data: userData } = await supabase
      .from("user_ids")
      .select("nickname, points, custom_id")
      .eq("email", user.email)
      .maybeSingle();

    // 🌟 소셜 로그인(구글/카카오)으로 처음 로그인한 유저는 user_ids에 없으므로 자동 생성
    if (!userData) {
      const socialNickname =
        user.user_metadata?.nickname ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email.split("@")[0];
      const generatedCustomId = `social_${user.id.slice(0, 8)}`;

      const { data: inserted } = await supabase
        .from("user_ids")
        .insert({ custom_id: generatedCustomId, email: user.email, nickname: socialNickname, points: 0 })
        .select("nickname, points, custom_id")
        .maybeSingle();

      userData = inserted;
    }

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

        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive" 
        />
        
          <MobileMenuProvider>
          {/* 상단 헤더 */}
          <Header />

          {/* 본문 + 사이드바 컨테이너 */}
          <div className="layout-container">

            <main className="main-content">
              {children}
            </main>

            {/* 🌟 서버에서 완성된 유저/공지 데이터를 사이드바에 즉시 전달! */}
            <Sidebar initialUser={initialUser} initialNotices={initialNotices} />

          </div>
        </MobileMenuProvider>
        <Footer />

      </body>
    </html>
  );
}