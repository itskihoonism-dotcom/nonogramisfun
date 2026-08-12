"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBox() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL에 이미 검색어가 있다면 가져와서 기본값으로 세팅합니다.
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");

  const handleSearch = () => {
    if (keyword.trim()) {
      // 검색어가 있으면 URL에 달아서 이동합니다. (예: /community?q=안녕)
      router.push(`/community?q=${encodeURIComponent(keyword)}`);
    } else {
      // 빈칸으로 검색하면 전체 목록으로 돌아갑니다.
      router.push(`/community`);
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="제목 또는 내용 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <button className="search-btn" onClick={handleSearch}>검색</button>
    </div>
  );
}