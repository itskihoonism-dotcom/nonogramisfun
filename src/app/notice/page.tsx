import { createClient } from "../../lib/supabaseServer";
import NoticeClient from "../../components/NoticeClient";
import KakaoAd from "../../components/KakaoAd";

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

    
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
                    <div className="ad-pc">
                      <KakaoAd unit="DAN-r7UxzhMfPVZQilVh" width="728" height="90" />
                    </div>
            
                    <div className="ad-mobile">
                      <KakaoAd unit="DAN-8gBtol149cRHiI4x" width="320" height="100" />
                    </div>
                  </div>
                  {/* 📢 카카오 애드핏 광고 끝 */}

    </>

    
  );
}