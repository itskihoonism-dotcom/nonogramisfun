"use client";

import { useState } from "react";
import { createClient } from "../lib/supabaseClient";
import Link from "next/link";

export default function Sidebar({
  initialUser,
  initialNotices,
}: {
  initialUser: { nickname: string; points: number; isAdmin: boolean } | null;
  initialNotices: any[];
}) {
  const supabase = createClient();

  // 🌟 서버에서 이미 받아온 정보로 초기값을 채우므로 로딩/깜빡임이 완전히 사라집니다!
  const [userInfo, setUserInfo] = useState(initialUser);
  const notices = initialNotices;

  // 모달창 상태
  const [showSignup, setShowSignup] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  // 🌟 모바일 햄버거 메뉴(드로어) 상태
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 폼 입력 상태
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [signupId, setSignupId] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [signupPwConfirm, setSignupPwConfirm] = useState("");
  const [signupNick, setSignupNick] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [idCheck, setIdCheck] = useState({ checked: false, msg: "", color: "" });
  const [nickCheck, setNickCheck] = useState({ checked: false, msg: "", color: "" });
  const [resetEmail, setResetEmail] = useState("");

  // 로그인
  const handleLogin = async () => {
    if (!loginId || !loginPw) return alert("아이디와 비밀번호를 입력해주세요.");
    try {
      const { data, error: searchError } = await supabase
        .from("user_ids")
        .select("email")
        .eq("custom_id", loginId)
        .maybeSingle();

      if (searchError || !data) return alert("존재하지 않는 아이디입니다.");

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: loginPw,
      });

      if (loginError) return alert("비밀번호가 틀렸습니다.");

      alert("로그인 되었습니다!");
      window.location.reload();
    } catch (err: any) {
      alert("로그인 에러: " + err.message);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    await supabase.auth.signOut();
    alert("안전하게 로그아웃 되었습니다.");
    window.location.href = "/";
  };

  // 중복 확인 & 회원가입 & 비밀번호 찾기
  const handleCheckId = async () => {
    if (!signupId) return setIdCheck({ checked: false, msg: "아이디를 입력해주세요.", color: "#ff4d4d" });
    const { data } = await supabase.from("user_ids").select("custom_id").eq("custom_id", signupId).maybeSingle();
    if (data) setIdCheck({ checked: false, msg: "이미 사용 중인 아이디입니다.", color: "#ff4d4d" });
    else setIdCheck({ checked: true, msg: "사용 가능한 아이디입니다.", color: "#4CAF50" });
  };

  const handleCheckNick = async () => {
    if (!signupNick) return setNickCheck({ checked: false, msg: "닉네임을 입력해주세요.", color: "#ff4d4d" });
    const { data } = await supabase.from("user_ids").select("nickname").eq("nickname", signupNick).maybeSingle();
    if (data) setNickCheck({ checked: false, msg: "이미 사용 중인 닉네임입니다.", color: "#ff4d4d" });
    else setNickCheck({ checked: true, msg: "사용 가능한 닉네임입니다.", color: "#4CAF50" });
  };

  const handleSignup = async () => {
    if (!idCheck.checked) return alert("아이디 중복확인을 먼저 진행해주세요.");
    if (!nickCheck.checked) return alert("닉네임 중복확인을 먼저 진행해주세요.");
    if (!signupId || !signupPw || !signupPwConfirm || !signupNick || !signupEmail) return alert("모든 항목을 입력해주세요.");
    if (signupPw.length < 6) return alert("비밀번호는 최소 6자 이상이어야 합니다.");
    if (signupPw !== signupPwConfirm) return alert("비밀번호가 일치하지 않습니다.");

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPw,
        options: { data: { custom_id: signupId, nickname: signupNick, points: 0 } },
      });
      if (authError) throw new Error(authError.message);

      await supabase.from("user_ids").insert([{ custom_id: signupId, email: signupEmail, nickname: signupNick }]);
      alert("📩 인증 메일이 발송되었습니다! 메일함 확인 후 로그인해주세요.");
      setShowSignup(false);
    } catch (err: any) {
      alert("에러: " + err.message);
    }
  };

  const handleFindId = async () => {
    const email = prompt("가입 시 등록하신 이메일 주소를 입력해 주세요.");
    if (!email) return;
    const { data } = await supabase.from("user_ids").select("custom_id").eq("email", email.trim()).maybeSingle();
    if (data?.custom_id) alert(`회원님의 아이디는 [ ${data.custom_id} ] 입니다.`);
    else alert("해당 이메일로 가입된 아이디를 찾을 수 없습니다.");
  };

  const handleResetEmail = async () => {
    if (!resetEmail) return alert("이메일을 입력해주세요.");
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: "https://nonogramisfun.com" });
    if (error) alert("발송 실패: " + error.message);
    else { alert("비밀번호 재설정 메일이 발송되었습니다!"); setShowResetPw(false); setResetEmail(""); }
  };

  const inputStyle = { fontSize: "16px", width: "100%", boxSizing: "border-box" as const, padding: "10px", marginBottom: "8px", border: "1px solid #ddd", borderRadius: "4px", background: "#f9f9f9" };
  const btnStyle = { flex: 1, padding: "10px", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" as const, cursor: "pointer" };

  return (
    <>
      {/* 🌟 모바일 햄버거 버튼 (헤더 로고 오른쪽에 겹쳐 보이도록 고정 위치) */}
      <button
        type="button"
        className="mobile-menu-btn"
        aria-label="메뉴 열기"
        onClick={() => setDrawerOpen(true)}
        style={{ position: "fixed", top: 0, left: "136px", height: "60px", width: "40px", background: "transparent", border: "none", color: "#fff", fontSize: "26px", cursor: "pointer", zIndex: 1100, alignItems: "center", justifyContent: "center" }}
      >
        ☰
      </button>

      {/* 🌟 드로어 배경 오버레이 */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1400 }}
        />
      )}

      <aside className={`sidebar${drawerOpen ? " sidebar-mobile-open" : ""}`} style={{ width: "300px", display: "flex", flexDirection: "column", gap: "15px", flexShrink: 0 }}>
        <style>{`
          @media (max-width: 850px) {
            .sidebar {
              display: flex !important;
              position: fixed;
              top: 0;
              left: 0;
              width: 80%;
              max-width: 300px;
              height: 100vh;
              background: #f5f6f7;
              z-index: 1500;
              padding: 20px;
              box-sizing: border-box;
              overflow-y: auto;
              margin: 0;
              transform: translateX(-105%);
              transition: transform 0.25s ease;
              box-shadow: 2px 0 12px rgba(0,0,0,0.25);
            }
            .sidebar.sidebar-mobile-open { transform: translateX(0); }
            .mobile-menu-btn { display: flex; }
            .sidebar-mobile-nav { display: flex !important; }
          }
          @media (min-width: 851px) {
            .mobile-menu-btn { display: none; }
          }
        `}</style>

        {/* 🌟 모바일 드로어 전용 사이트 내비게이션 (데스크톱 사이드바에는 보이지 않음) */}
        <nav className="sidebar-mobile-nav" style={{ display: "none", flexDirection: "column" }}>
          <Link href="/all-puzzles" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 4px", color: "#222", textDecoration: "none", fontWeight: "bold", fontSize: "15px", borderBottom: "1px solid #ddd" }}>
            🧩 창작노노그램
          </Link>
          <Link href="/community" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 4px", color: "#222", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}>
            💬 커뮤니티
          </Link>
        </nav>

        {/* 내 정보 / 로그인 위젯 */}
        <div className="sidebar-widget" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "20px" }}>
          <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", borderBottom: "2px solid #333", paddingBottom: "8px" }}>
            {userInfo ? "내 정보" : "로그인"}
          </h3>
          
          {!userInfo ? (
            <div id="login-form">
              <input type="text" placeholder="아이디 입력" style={inputStyle} value={loginId} onChange={(e) => setLoginId(e.target.value)} />
              <input type="password" placeholder="비밀번호" style={{ ...inputStyle, marginBottom: "12px" }} value={loginPw} onChange={(e) => setLoginPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              <div style={{ display: "flex", gap: "5px" }}>
                <button style={{ ...btnStyle, backgroundColor: "#333" }} onClick={handleLogin}>로그인</button>
                <button style={{ ...btnStyle, backgroundColor: "#2196F3" }} onClick={() => setShowSignup(true)}>회원가입</button>
              </div>
              <div style={{ marginTop: "12px", textAlign: "center", fontSize: "13px" }}>
                <a href="#" onClick={(e) => { e.preventDefault(); handleFindId(); }} style={{ color: "#666", textDecoration: "none" }}>아이디 찾기</a>
                <span style={{ color: "#ccc", margin: "0 8px" }}>|</span>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowResetPw(true); }} style={{ color: "#666", textDecoration: "none" }}>비밀번호 찾기</a>
              </div>
            </div>
          ) : (
            <div id="user-info" style={{ textAlign: "center" }}>
              <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px", color: "#111" }}>
                {userInfo.isAdmin ? "⚙️" : "👤"} <span style={{ verticalAlign: "middle" }}>{userInfo.nickname}님</span>
              </p>
              <p style={{ fontSize: "14px", fontWeight: "bold", marginTop: 0, marginBottom: "15px", color: "#ff5722" }}>
                🏆 내 포인트: {userInfo.points.toLocaleString()} P
              </p>
              <button onClick={handleLogout} style={{ width: "100%", padding: "10px", backgroundColor: "#ff4d4d", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* 공지사항 위젯 */}
        <div className="sidebar-widget" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "20px" }}>
          
          {/* 🌟 1. 제목 클릭 시 /notice 페이지로 이동 + '더보기' 텍스트 추가 */}
          <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", borderBottom: "2px solid #333", paddingBottom: "8px" }}>
            <Link href="/notice" onClick={() => setDrawerOpen(false)} style={{ textDecoration: "none", color: "#111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>공지사항</span>
              <span style={{ fontSize: "12px", color: "#888", fontWeight: "normal" }}>더보기 ❯</span>
            </Link>
          </h3>
          
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "#555" }}>
            {notices.length === 0 ? (
              <li style={{ padding: "6px 0", textAlign: "center", color: "#888" }}>등록된 공지가 없습니다.</li>
            ) : (
              notices.map((n) => (
                <li key={n.id} style={{ padding: "6px 0", borderBottom: "1px dashed #eee", cursor: "pointer" }}>
                  
                  {/* 🌟 2. 개별 글 클릭 시 /notice 페이지의 해당 글(아코디언)이 열리도록 파라미터 전달 */}
                  <Link href={`/notice?id=${n.id}`} onClick={() => setDrawerOpen(false)} style={{ textDecoration: "none", color: "inherit", display: "flex", gap: "5px" }}>
                    <span>📢</span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", width: "85%" }}>
                      {n.title}
                    </span>
                  </Link>
                  
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>

      {/* 회원가입 모달 */}
      {showSignup && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "8px", width: "340px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "15px", borderBottom: "2px solid #333", paddingBottom: "10px", fontSize: "18px" }}>회원가입</h3>
            <div style={{ display: "flex", gap: "5px", marginBottom: "4px" }}>
              <input type="text" placeholder="아이디 (영문/숫자만 가능)" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} value={signupId} onChange={(e) => { setSignupId(e.target.value); setIdCheck({ checked: false, msg: "", color: "" }); }} />
              <button style={{ padding: "10px 15px", backgroundColor: idCheck.checked ? "#4CAF50" : "#555", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", fontSize: "13px" }} onClick={handleCheckId}>
                {idCheck.checked ? "확인완료" : "중복확인"}
              </button>
            </div>
            {idCheck.msg && <div style={{ fontSize: "12px", marginBottom: "8px", color: idCheck.color }}>{idCheck.msg}</div>}
            <input type="password" placeholder="비밀번호 (6자 이상)" style={inputStyle} value={signupPw} onChange={(e) => setSignupPw(e.target.value)} />
            <input type="password" placeholder="비밀번호 확인" style={inputStyle} value={signupPwConfirm} onChange={(e) => setSignupPwConfirm(e.target.value)} />
            <div style={{ display: "flex", gap: "5px", marginBottom: "4px" }}>
              <input type="text" placeholder="닉네임" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} value={signupNick} onChange={(e) => { setSignupNick(e.target.value); setNickCheck({ checked: false, msg: "", color: "" }); }} />
              <button style={{ padding: "10px 15px", backgroundColor: nickCheck.checked ? "#4CAF50" : "#555", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", fontSize: "13px" }} onClick={handleCheckNick}>
                {nickCheck.checked ? "확인완료" : "중복확인"}
              </button>
            </div>
            {nickCheck.msg && <div style={{ fontSize: "12px", marginBottom: "8px", color: nickCheck.color }}>{nickCheck.msg}</div>}
            <input type="email" placeholder="이메일 (인증용)" style={{ ...inputStyle, marginBottom: "15px" }} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
            <div style={{ display: "flex", gap: "5px" }}>
              <button style={{ ...btnStyle, backgroundColor: "#2196F3" }} onClick={handleSignup}>가입하기</button>
              <button style={{ ...btnStyle, backgroundColor: "#999" }} onClick={() => setShowSignup(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 찾기 모달 */}
      {showResetPw && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "8px", width: "340px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "15px", borderBottom: "2px solid #333", paddingBottom: "10px", fontSize: "18px" }}>비밀번호 찾기</h3>
            <p style={{ fontSize: "13px", color: "#555", marginBottom: "15px" }}>가입 시 등록한 이메일을 입력하시면 재설정 링크를 보내드립니다.</p>
            <input type="email" placeholder="이메일 주소 입력" style={{ ...inputStyle, marginBottom: "15px" }} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            <div style={{ display: "flex", gap: "5px" }}>
              <button style={{ ...btnStyle, backgroundColor: "#2196F3" }} onClick={handleResetEmail}>메일 발송</button>
              <button style={{ ...btnStyle, backgroundColor: "#999" }} onClick={() => setShowResetPw(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}