"use client";

import { useState } from "react";

export default function Footer() {
  // 🌟 모달창 상태 관리 ('privacy', 'terms', 'contact', null)
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (id: string) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  // 모달 바깥 배경 클릭 시 닫기
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("ft-modal")) {
      closeModal();
    }
  };

  return (
    <>
      {/* 🌟 Footer 전용 스타일 */}
      <style>{`
        .site-footer { background-color: #222; color: #aaa; padding: 25px 0; text-align: center; font-size: 13px; margin-top: auto; }
        .footer-links { margin-bottom: 15px; }
        .footer-links button { background: none; border: none; color: #ddd; text-decoration: none; margin: 0 15px; cursor: pointer; font-weight: 500; font-size: 13px; transition: color 0.2s; padding: 0; }
        .footer-links button:hover { color: #2196F3; text-decoration: underline; }
        .footer-copyright { color: #777; }

        .ft-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); justify-content: center; align-items: center; z-index: 3000; }
        .ft-modal.active { display: flex; }
        .ft-modal-content { background: #fff; color: #333; padding: 30px 40px; border-radius: 8px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; text-align: left; line-height: 1.6; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .ft-modal-content h3 { margin-top: 0; font-size: 18px; color: #111; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .ft-modal-content h4 { margin: 20px 0 10px 0; color: #444; }
        .ft-close-btn { display: block; width: 100%; padding: 12px; background: #333; color: #fff; border: none; border-radius: 4px; font-weight: bold; font-size: 15px; cursor: pointer; margin-top: 25px; transition: background 0.2s; }
        .ft-close-btn:hover { background: #111; }
      `}</style>

      {/* 🌟 Footer 본체 */}
      <footer className="site-footer">
        <div className="footer-links">
          <button onClick={() => openModal('privacy')}>개인정보처리방침</button> |
          <button onClick={() => openModal('terms')}>이용약관</button> |
          <button onClick={() => openModal('contact')}>문의하기</button>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} NONOGRAM IS FUN. All rights reserved.
        </div>
      </footer>

      {/* 🌟 개인정보처리방침 모달 */}
      <div className={`ft-modal ${activeModal === 'privacy' ? 'active' : ''}`} onClick={handleBackgroundClick}>
        <div className="ft-modal-content">
          <h3>개인정보처리방침</h3>
          <p>NONOGRAM IS FUN(이하 '서비스')은 이용자의 소중한 개인정보를 보호하며, 관련 법령을 준수하고 있습니다.</p>
          <h4>1. 수집하는 개인정보 항목</h4>
          <p>본 서비스는 회원가입 시 별도의 민감한 개인정보를 수집하지 않으며, 게임 진행 데이터 및 커뮤니티 데이터는 안전하게 보관됩니다.</p>
          <h4>2. 개인정보의 수집 및 이용 목적</h4>
          <p>수집된 정보는 오직 퍼즐 진행 상황 저장, 커뮤니티 서비스 제공 및 사용자 경험 개선을 위해서만 활용됩니다.</p>
          <button className="ft-close-btn" onClick={closeModal}>닫기</button>
        </div>
      </div>

      {/* 🌟 이용약관 모달 */}
      <div className={`ft-modal ${activeModal === 'terms' ? 'active' : ''}`} onClick={handleBackgroundClick}>
        <div className="ft-modal-content">
          <h3>이용약관</h3>
          <h4>제 1 조 (목적)</h4>
          <p>본 약관은 NONOGRAM IS FUN(이하 '사이트')이 제공하는 노노그램 및 커뮤니티 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
          <h4>제 2 조 (서비스의 이용)</h4>
          <p>이용자는 사이트에서 제공하는 퍼즐을 자유롭게 플레이하고 제작하며 커뮤니티를 이용할 수 있습니다.</p>
          <button className="ft-close-btn" onClick={closeModal}>닫기</button>
        </div>
      </div>

      {/* 🌟 문의하기 모달 */}
      <div className={`ft-modal ${activeModal === 'contact' ? 'active' : ''}`} onClick={handleBackgroundClick}>
        <div className="ft-modal-content" style={{ textAlign: "center" }}>
          <h3>문의하기</h3>
          <p style={{ marginBottom: "20px" }}>서비스 이용 중 불편한 점이나 건의사항이 있으신가요?</p>
          <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontSize: "16px" }}>
              📧 <strong>이메일 문의:</strong><br />
              <a href="mailto:admin@nonogramisfun.com" style={{ color: "#2196F3", textDecoration: "none", fontWeight: "bold", display: "inline-block", marginTop: "10px" }}>admin@nonogramisfun.com</a>
            </p>
          </div>
          <button className="ft-close-btn" onClick={closeModal}>닫기</button>
        </div>
      </div>
    </>
  );
}