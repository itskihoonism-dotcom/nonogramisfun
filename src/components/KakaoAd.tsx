"use client";

import { useEffect, useRef } from "react";

export default function KakaoAd({ unit, width, height }: { unit: string; width: string; height: string }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. 만약 혹시 모를 이전 광고 찌꺼기가 남아있다면 깨끗하게 청소합니다.
    if (adRef.current) {
      adRef.current.innerHTML = "";
    }

    // 2. 카카오 광고 껍데기(<ins>)를 자바스크립트로 직접 만듭니다.
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-width", width);
    ins.setAttribute("data-ad-height", height);
    ins.setAttribute("data-ad-unit", unit);

    // 3. 카카오 광고 스크립트를 만듭니다.
    const script = document.createElement("script");
    script.src = "//t1.kakaocdn.net/kas/static/ba.min.js";
    script.async = true;

    // 4. 준비된 껍데기와 스크립트를 화면(div)에 꽂아 넣습니다.
    if (adRef.current) {
      adRef.current.appendChild(ins);
      adRef.current.appendChild(script);
    }

    // 🌟 5. 핵심: 유저가 다른 페이지로 이동할 때 광고를 흔적도 없이 지워버립니다! (카운터 초기화)
    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = "";
      }
    };
  }, [unit, width, height]);

  // JSX에는 아무것도 없는 빈 상자만 둡니다. (useEffect가 알아서 채워줍니다)
  return <div ref={adRef} style={{ display: "flex", justifyContent: "center", width: "100%" }} />;
}