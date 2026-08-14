import React from "react";
import { s } from "@/lib/legalstyles";

export const metadata = {
  title: "개인정보처리방침 | NONOGRAM IS FUN",
  description:
    "NONOGRAM IS FUN의 개인정보 수집·이용·보관 방침 및 광고 쿠키 사용에 대한 안내입니다.",
};

// ⚠️ 방침을 수정하실 때마다 이 날짜를 갱신하세요.
const EFFECTIVE_DATE = "2026년 8월 15일";
const CONTACT_EMAIL = "admin@nonogramisfun.com";

export default function PrivacyPolicyPage() {
  return (
    <main style={s.page}>
      <h1 style={s.h1}>개인정보처리방침</h1>
      <p style={s.effective}>시행일자: {EFFECTIVE_DATE}</p>

      <p style={s.p}>
        <b>NONOGRAM IS FUN</b>(이하 &apos;사이트&apos;)은 이용자의 개인정보를
        중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 본
        개인정보처리방침은 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로
        이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지
        알려드립니다.
      </p>

      <h2 style={s.h2}>1. 수집하는 개인정보의 항목 및 수집 방법</h2>
      <p style={s.p}>사이트는 다음과 같은 정보를 수집합니다.</p>
      <p style={s.p}>
        <b>가. 회원가입 및 로그인 시 수집하는 정보</b>
      </p>
      <ul style={s.ul}>
        <li style={s.li}>필수 항목: 이메일 주소, 닉네임(아이디), 비밀번호</li>
      </ul>
      <p style={s.p}>
        <b>나. 서비스 이용 과정에서 자동으로 수집되는 정보</b>
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          IP 주소, 쿠키, 접속 일시, 브라우저 및 기기 정보, 서비스 이용 기록
        </li>
        <li style={s.li}>
          퍼즐 진행 상황 및 완료 기록, 작성한 게시글·댓글·추천 내역
        </li>
      </ul>
      <p style={s.p}>
        <b>다. 수집 방법</b> — 웹사이트 회원가입, 서비스 이용 과정에서의 자동
        생성 및 수집
      </p>

      <h2 style={s.h2}>2. 개인정보의 수집 및 이용 목적</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          서비스 제공: 퍼즐 플레이 및 제작, 진행 상황 저장, 커뮤니티 이용
        </li>
        <li style={s.li}>
          회원 관리: 본인 확인, 개인 식별, 부정 이용 방지, 가입 의사 확인,
          문의사항 처리
        </li>
        <li style={s.li}>
          서비스 개선: 이용 통계 분석을 통한 신규 콘텐츠 개발 및 사용자 경험 개선
        </li>
        <li style={s.li}>광고 게재: 맞춤형 광고를 포함한 광고 서비스 제공</li>
      </ul>

      <h2 style={s.h2}>3. 쿠키의 사용 및 구글 애드센스 광고</h2>
      <p style={s.p}>
        사이트는 이용자에게 개인화된 서비스를 제공하기 위해 쿠키(cookie)를
        사용합니다. 쿠키는 웹사이트가 이용자의 브라우저에 저장하는 소량의 텍스트
        파일로, 로그인 상태 유지와 퍼즐 진행 상황 저장 등에 사용됩니다.
      </p>
      <div style={s.callout}>
        <ul style={{ ...s.ul, marginBottom: 0 }}>
          <li style={s.li}>
            Google을 포함한 제3자 공급업체는 쿠키를 사용하여 사용자가 당사
            웹사이트 또는 다른 웹사이트를 이전에 방문한 내역을 기반으로 광고를
            게재합니다.
          </li>
          <li style={s.li}>
            Google 및 파트너는 광고 쿠키를 사용하여 인터넷의 당사 사이트 및/또는
            다른 사이트 방문 내역을 기반으로 사용자에게 맞춤 광고를 게재할 수
            있습니다.
          </li>
          <li style={s.li}>
            사용자는{" "}
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noreferrer"
              style={s.link}
            >
              광고 설정(adssettings.google.com)
            </a>
            을 방문하여 맞춤 광고를 선택 해제할 수 있습니다. 또는{" "}
            <a
              href="https://www.aboutads.info/"
              target="_blank"
              rel="noreferrer"
              style={s.link}
            >
              www.aboutads.info
            </a>
            를 방문하여 맞춤 광고에 사용되는 제3자 공급업체의 쿠키를 선택 해제할
            수 있습니다.
          </li>
        </ul>
      </div>
      <p style={s.p}>
        이용자는 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만 쿠키
        저장을 거부할 경우 로그인이 필요한 일부 서비스 이용에 제한이 발생할 수
        있습니다.
      </p>

      <h2 style={s.h2}>4. 개인정보 처리의 위탁</h2>
      <p style={s.p}>
        사이트는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를
        외부에 위탁하고 있으며, 위탁 계약 시 개인정보가 안전하게 관리될 수 있도록
        필요한 사항을 규정하고 있습니다.
      </p>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>수탁업체</th>
            <th style={s.th}>위탁 업무 내용</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={s.td}>Supabase Inc.</td>
            <td style={s.td}>
              회원 인증(로그인) 처리, 회원 정보 및 서비스 데이터 저장·관리,
              이미지 파일 보관
            </td>
          </tr>
          <tr>
            <td style={s.td}>Netlify, Inc.</td>
            <td style={s.td}>웹사이트 호스팅 및 서버 운영, 접속 로그 관리</td>
          </tr>
          <tr>
            <td style={s.td}>Google LLC</td>
            <td style={s.td}>광고 게재 및 서비스 이용 통계 분석</td>
          </tr>
        </tbody>
      </table>
      <p style={s.p}>
        위탁 업무의 특성상 이용자의 개인정보가 국외에 저장·처리될 수 있습니다.
        이용자는 개인정보의 국외 이전을 거부할 수 있으나, 이 경우 회원 가입 및
        서비스 이용이 제한될 수 있습니다.
      </p>

      <h2 style={s.h2}>5. 개인정보의 보유 및 이용 기간</h2>
      <p style={s.p}>
        원칙적으로 개인정보의 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체
        없이 파기합니다. 회원 탈퇴 시 회원 정보는 즉시 삭제되며, 이용자가 작성한
        게시글 및 퍼즐은 삭제되지 않고 유지될 수 있습니다. 다만 관계 법령에 따라
        보존이 필요한 경우 아래 기간 동안 보관합니다.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          표시·광고에 관한 기록: 6개월 (전자상거래 등에서의 소비자보호에 관한
          법률)
        </li>
        <li style={s.li}>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (동법)</li>
        <li style={s.li}>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
      </ul>

      <h2 style={s.h2}>6. 이용자 및 법정대리인의 권리와 행사 방법</h2>
      <p style={s.p}>
        이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를
        요구할 수 있습니다. 회원정보 페이지에서 직접 조회 및 수정하거나, 아래
        문의처로 연락 주시면 지체 없이 조치하겠습니다. 회원 탈퇴는 사이트 내
        회원정보 메뉴 또는 문의처를 통해 신청하실 수 있습니다.
      </p>

      <h2 style={s.h2}>7. 만 14세 미만 아동의 개인정보</h2>
      <p style={s.p}>
        사이트는 만 14세 미만 아동의 개인정보를 수집할 경우 법정대리인의 동의를
        받습니다. 법정대리인은 아동의 개인정보에 대한 열람, 정정, 삭제 및
        처리정지를 요구할 수 있습니다.
      </p>

      <h2 style={s.h2}>8. 개인정보의 안전성 확보 조치</h2>
      <ul style={s.ul}>
        <li style={s.li}>비밀번호의 암호화 저장 및 전송 구간 암호화(HTTPS)</li>
        <li style={s.li}>개인정보 처리 시스템에 대한 접근 권한 최소화 및 관리</li>
        <li style={s.li}>해킹 및 악성코드 대비를 위한 보안 조치 적용</li>
      </ul>

      <h2 style={s.h2}>9. 개인정보 보호책임자 및 문의처</h2>
      <p style={s.p}>
        개인정보 처리에 관한 문의, 불만 처리, 피해 구제 등에 관한 사항은 아래로
        연락해 주시기 바랍니다.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          이메일:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>
            {CONTACT_EMAIL}
          </a>
        </li>
      </ul>
      <p style={s.p}>
        기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에
        문의하실 수 있습니다.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)
        </li>
        <li style={s.li}>대검찰청 사이버수사과 (spo.go.kr / 국번없이 1301)</li>
        <li style={s.li}>경찰청 사이버수사국 (ecrm.police.go.kr / 국번없이 182)</li>
      </ul>

      <h2 style={s.h2}>10. 개인정보처리방침의 변경</h2>
      <p style={s.p}>
        본 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 경우 시행 최소 7일
        전부터 공지사항을 통해 안내합니다.
      </p>

      <p style={s.footerNote}>
        본 개인정보처리방침은 {EFFECTIVE_DATE}부터 적용됩니다.
      </p>
    </main>
  );
}