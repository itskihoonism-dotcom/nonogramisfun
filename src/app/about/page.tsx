import React from "react";
import Link from "next/link";
import { s } from "@/lib/legalstyles";

export const metadata = {
  title: "소개 | NONOGRAM IS FUN",
  description:
    "NONOGRAM IS FUN을 만든 이유와 운영 방식, 퍼즐이 만들어지는 과정을 소개합니다.",
};

const CONTACT_EMAIL = "admin@nonogramisfun.com";

export default function AboutPage() {
  return (
    <main style={s.page}>
      <h1 style={s.h1}>소개</h1>
      <p style={s.effective}>NONOGRAM IS FUN이 궁금하신 분들께</p>

      <h2 style={s.h2}>왜 만들었나요</h2>
      <p style={s.p}>
        NONOGRAM IS FUN은 노노그램(네모로직)을 좋아하는 한 사람이 취미로
        시작해 혼자 기획하고 개발하며 운영하고 있는 개인 프로젝트입니다.
        기존에 있던 노노그램 사이트들을 즐겨 하다가, &quot;내가 좋아하는
        캐릭터나 장면으로 직접 퍼즐을 만들어서 다른 사람들과 나눠 풀 수 있는
        곳이 있으면 좋겠다&quot;는 생각에서 출발했습니다. 처음엔 개인적으로
        쓸 작은 도구로 만들었는데, 만들다 보니 욕심이 생겨서 회원가입, 커뮤니티
        게시판, 포인트 시스템까지 갖춘 지금의 형태가 되었습니다.
      </p>

      <h2 style={s.h2}>퍼즐은 어떻게 만들어지나요</h2>
      <p style={s.p}>
        사이트의 &lt;창작노노그램&gt; 메뉴에서 누구나 원하는 그림을 픽셀
        단위로 직접 칠해서 나만의 노노그램 퍼즐을 만들 수 있습니다. 만든
        퍼즐은 운영자의 승인을 거쳐 사이트에 공개되며, 공개된 퍼즐은 다른
        이용자들이 자유롭게 플레이하고 댓글과 추천을 남길 수 있습니다. 즉,
        사이트에 올라온 퍼즐 대부분은 저를 포함한 이용자들이 취미로 직접
        만든 결과물입니다.
      </p>

      <h2 style={s.h2}>누가 운영하나요</h2>
      <p style={s.p}>
        사이트는 개발자 1인이 기획, 개발, 디자인, 운영을 모두 맡아 만들고
        있습니다. 공지사항과 커뮤니티에 &apos;주인장&apos;이라는 이름으로
        댓글을 남기는 계정이 바로 운영자 본인입니다. 버그 제보나 개선
        건의사항은 커뮤니티 게시판이나 아래 문의 채널을 통해 직접 받아서
        하나씩 반영하고 있습니다.
      </p>

      <h2 style={s.h2}>문의</h2>
      <p style={s.p}>
        서비스 이용 중 궁금한 점이나 불편한 점이 있다면{" "}
        <Link href="/contact" style={s.link}>
          문의 페이지
        </Link>
        를 통해 알려주세요. 이메일({CONTACT_EMAIL})로 직접 연락하셔도
        됩니다.
      </p>
    </main>
  );
}