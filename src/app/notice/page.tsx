import { createClient } from "../../lib/supabaseServer";
import NoticeClient from "../../components/NoticeClient";
import Script from "next/script";

export const metadata = {
  title: "공지사항 | NONOGRAM IS FUN",
};

export const dynamic = "force-dynamic";

export default async function NoticePage({ searchParams }: { searchParams: any }) {
  const supabase = await createClient();
  
  // 1. 관리자(주인장) 여부 미리 확인하기
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user && user.email) {
    const { data: userData } = await supabase
      .from("user_ids")
      .select("custom_id, nickname")
      .eq("email", user.email)
      .maybeSingle();
      
    const nickname = userData?.nickname || user.user_metadata?.nickname;
    if (nickname === "주인장" || userData?.custom_id === "admin") {
      isAdmin = true;
    }
  }

  // 2. notices 테이블에서 공지사항 전체 가져오기
  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });

  // 3. 주소창에서 id 파라미터 읽기 (사이드바 등에서 특정 공지 클릭 시)
  const resolvedParams = await Promise.resolve(searchParams);
  const targetId = resolvedParams?.id ? Number(resolvedParams.id) : null;

  return (
    <>

    
    
    <NoticeClient 
      initialNotices={notices || []} 
      isAdmin={isAdmin} 
      targetId={targetId} 
    />

    {/* 📢 기기별 맞춤 카카오 애드핏 광고 시작 */}
      <div>
        <div className="ad-pc">
          <ins className="kakao_ad_area" style={{ display: "none" }}
            data-ad-unit="DAN-r7UxzhMfPVZQilVh" 
            data-ad-width="728" 
            data-ad-height="90"></ins>
        </div>

        <div className="ad-mobile">
          <ins className="kakao_ad_area" style={{ display: "none" }}
            data-ad-unit="DAN-8gBtol149cRHiI4x" 
            data-ad-width="320" 
            data-ad-height="100"></ins>
        </div>
        
        {/* 🌟 Next.js 방식의 카카오 애드핏 스크립트 실행 */}
        <Script type="text/javascript" src="//t1.kakaocdn.net/kas/static/ba.min.js" strategy="lazyOnload" />
      </div>
      {/* 📢 카카오 애드핏 광고 끝 */}

    </>

    
  );
}