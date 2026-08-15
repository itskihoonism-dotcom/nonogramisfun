import { CSSProperties } from "react";


// 개인정보처리방침 / 이용약관 등 정책 페이지 공용 스타일
export const s: Record<string, CSSProperties> = {
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px 80px",
    lineHeight: 1.7,
    color: "#333",
    fontSize: "14px",
    wordBreak: "keep-all",
  },
  h1: {
    fontSize: "24px",
    fontWeight: "bold",
    borderBottom: "2px solid #222",
    paddingBottom: "10px",
    marginBottom: "8px",
  },
  effective: {
    fontSize: "13px",
    color: "#777",
    marginBottom: "28px",
  },
  h2: {
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "32px",
    marginBottom: "10px",
  },
  p: { marginBottom: "12px" },
  ul: { margin: "0 0 12px", paddingLeft: "20px" },
  li: { marginBottom: "6px" },
  callout: {
    background: "#f9f9f9",
    padding: "16px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    marginBottom: "12px",
  },
  link: { color: "#2196F3", textDecoration: "underline" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    margin: "0 0 12px",
    fontSize: "13px",
  },
  th: {
    border: "1px solid #ddd",
    padding: "8px 10px",
    background: "#f5f5f5",
    textAlign: "left",
    fontWeight: "bold",
  },
  td: { border: "1px solid #ddd", padding: "8px 10px", verticalAlign: "top" },
  footerNote: {
    marginTop: "40px",
    paddingTop: "16px",
    borderTop: "1px solid #eee",
    fontSize: "13px",
    color: "#666",
  },
};