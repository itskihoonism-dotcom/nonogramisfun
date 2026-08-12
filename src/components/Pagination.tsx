"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Pagination({ totalCount, postsPerPage }: { totalCount: number, postsPerPage: number }) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const q = searchParams.get("q") || "";
  
  const totalPages = Math.ceil(totalCount / postsPerPage);

  if (totalCount === 0) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
      {pages.map((page) => {
        // 🌟 따옴표와 백틱 문법 에러를 깔끔하게 수정했습니다!
        const url = `/community?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
        const isActive = page === currentPage;
        
        return (
          <Link key={page} href={url} style={{
            padding: "6px 12px", 
            border: "1px solid #ddd", 
            borderRadius: "4px", 
            fontSize: "14px", 
            cursor: "pointer",
            background: isActive ? "#ff6d00" : "#fff",
            color: isActive ? "#fff" : "#333",
            fontWeight: isActive ? "bold" : "normal",
            borderColor: isActive ? "#ff6d00" : "#ddd",
            textDecoration: "none",
            display: "inline-block"
          }}>
            {page}
          </Link>
        );
      })}
    </div>
  );
}