import React from "react";
import Link from "next/link";
import { s } from "@/lib/legalstyles";

export const metadata = {
  title: "문의하기 | NONOGRAM IS FUN",
  description:
    "NONOGRAM IS FUN 이용 중 불편한 점이나 건의사항을 남길 수 있는 문의 채널을 안내합니다.",
};

const CONTACT_EMAIL = "admin@nonogramisfun.com";

export default function ContactPage() {
  return (
    <main style={s.page}>
      <h1 style={s.h1}>문의하기</h1>
      <p style={s.effective}>서비스 이용 중 궁금한 점이나 건의사항을 남겨주세요</p>

      <p style={s.p}>
        NONOGRAM IS FUN은 개발자 1인이 운영하는 사이트입니다. 아래 이메일로
        문의를 남겨주시면 확인 후 답변드립니다. 가능한 한 빠르게 확인하지만,
        운영자가 혼자 처리하다 보니 답변까지 며칠 정도 걸릴 수 있는 점 양해
        부탁드립니다.
      </p>

      <div style={s.callout}>
        <p style={{ margin: 0, fontSize: "16px" }}>
          📧 <b>이메일 문의</b>
          <br />
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ ...s.link, fontWeight: "bold" }}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>

      <h2 style={s.h2}>이런 내용을 문의하실 수 있어요</h2>
      <ul style={s.ul}>
        <li style={s.li}>버그 제보 및 오류 신고</li>
        <li style={s.li}>기능 개선 건의사항</li>
        <li style={s.li}>게시물 신고 및 권리 침해 관련 요청</li>
        <li style={s.li}>계정, 로그인 등 이용 관련 문의</li>
        <li style={s.li}>제휴 및 광고 관련 문의</li>
      </ul>

      <h2 style={s.h2}>커뮤니티를 통한 소통</h2>
      <p style={s.p}>
        간단한 건의사항이나 다른 이용자들과 함께 나누고 싶은 이야기는{" "}
        <Link href="/community" style={s.link}>
          커뮤니티 게시판
        </Link>
        에 남겨주셔도 좋습니다. 운영자가 &apos;주인장&apos; 계정으로 직접
        확인하고 답변합니다.
      </p>

      <p style={s.footerNote}>
        NONOGRAM IS FUN에 대해 더 알고 싶으시다면{" "}
        <Link href="/about" style={s.link}>
          소개 페이지
        </Link>
        도 확인해보세요.
      </p>
    </main>
  );
}
