"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useState, useEffect, useRef } from "react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { ResizableTableRow } from "@/components/ResizableTableRow";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { FontSize } from "@/components/FontSize";
import { Indent } from "@/components/Indent";
import { ResizableImage } from "@/components/ResizableImage";
import { RawHtmlBlock } from "@/components/RawHtmlBlock";
import { createClient } from "@/lib/supabaseClient";

export default function TiptapEditor({ content, onChange, onImageUpload }: { content: string; onChange: (html: string) => void; onImageUpload?: (url: string) => void }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Table.configure({ resizable: true }),
      ResizableTableRow,
      TableHeader,
      TableCell,
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FontSize,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Indent,
      ResizableImage,
      RawHtmlBlock,
    ],
    content,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      setTimeout(() => {
        onChange(editor.getHTML());
      }, 0);
    },
    immediatelyRender: false,
  }, []);

const [state, setState] = useState({
  bold: false, italic: false, underline: false, strike: false,
  h1: false, h2: false, h3: false, bulletList: false, orderedList: false,
  align: "left", fontSize: "default", fontFamily: "default",
});

  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffeb3b");

  

  useEffect(() => {
    if (!editor) return;
    const updateState = () => {
      setState({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        h1: editor.isActive("heading", { level: 1 }),
        h2: editor.isActive("heading", { level: 2 }),
        h3: editor.isActive("heading", { level: 3 }),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        align: editor.getAttributes("paragraph").textAlign || editor.getAttributes("heading").textAlign || "left",
        fontSize: editor.getAttributes("textStyle").fontSize || "default",
        fontFamily: editor.getAttributes("textStyle").fontFamily || "default",
      });
    };
    editor.on("transaction", updateState);
    updateState();
    return () => {
      editor.off("transaction", updateState);
    };
  }, [editor]);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt("링크 URL 입력");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("이미지는 2MB를 초과할 수 없습니다.");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `post_images/${fileName}`;

    const { error } = await supabase.storage.from("community_images").upload(filePath, file);
    setUploading(false);

    if (error) {
      alert("이미지 업로드 실패: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("community_images").getPublicUrl(filePath);
    onImageUpload?.(data.publicUrl);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
  };

  const btnStyle = (active: boolean) => ({
    padding: "6px 10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    background: active ? "#333" : "#fff",
    color: active ? "#fff" : "#333",
    fontSize: "13px",
    cursor: "pointer",
  });

  const selectStyle = {
    padding: "6px 8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "13px",
    background: "#fff",
    cursor: "pointer",
  };

  const headingValue = state.h1 ? "h1" : state.h2 ? "h2" : state.h3 ? "h3" : "paragraph";

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px", borderBottom: "1px solid #eee", background: "#fafafa", alignItems: "center" }}>
        <select
          value={headingValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "paragraph") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(val.replace("h", "")) as 1 | 2 | 3 }).run();
          }}
          style={selectStyle}
        >
          <option value="paragraph">본문</option>
          <option value="h1">제목 1</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
        </select>

        <select
  value={state.fontFamily}
  onChange={(e) => {
    const val = e.target.value;
    if (val === "default") editor.chain().focus().unsetFontFamily().run();
    else editor.chain().focus().setFontFamily(val).run();
  }}
  style={selectStyle}
>
  <option value="default">기본 서체</option>
  <option value="'맑은 고딕', 'Apple SD Gothic Neo', sans-serif">고딕체</option>
  <option value="'바탕', 'Apple SD 산돌고딕Neo', serif">명조체</option>
  <option value="Arial, sans-serif">Arial</option>
  <option value="Georgia, serif">Georgia</option>
  <option value="'Courier New', monospace">고정폭</option>
</select>

        <select
          value={state.fontSize}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "default") editor.chain().focus().unsetFontSize().run();
            else editor.chain().focus().setFontSize(val).run();
          }}
          style={selectStyle}
        >
          <option value="default">기본 크기</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>

        <select
          value={state.align}
          onChange={(e) => editor.chain().focus().setTextAlign(e.target.value).run()}
          style={selectStyle}
        >
          <option value="left">좌측 정렬</option>
          <option value="center">가운데 정렬</option>
          <option value="right">우측 정렬</option>
          <option value="justify">양쪽 정렬</option>
        </select>

        <button type="button" onMouseDown={(e) => e.preventDefault()} style={btnStyle(state.bold)} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} style={btnStyle(state.italic)} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} style={btnStyle(state.underline)} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} style={btnStyle(state.strike)} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>

<label title="글자 색" style={{ position: "relative", width: "30px", height: "30px", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "#fff" }}>
  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#333", lineHeight: 1 }}>A</span>
  <span style={{ position: "absolute", bottom: "4px", left: "6px", right: "6px", height: "3px", background: textColor, borderRadius: "1px" }} />
  <input
    type="color"
    value={textColor}
    onMouseDown={(e) => e.preventDefault()}
    onChange={(e) => { setTextColor(e.target.value); editor.chain().focus().setColor(e.target.value).run(); }}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }}
  />
</label>

<label title="배경 색" style={{ position: "relative", width: "30px", height: "30px", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "#fff" }}>
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#333" strokeWidth="1.3">
    <path d="M10 2 L14 6 L7 13 L3 13 L3 9 Z" />
    <line x1="8.5" y1="3.5" x2="12.5" y2="7.5" />
  </svg>
  <span style={{ position: "absolute", bottom: "4px", left: "6px", right: "6px", height: "3px", background: highlightColor, borderRadius: "1px" }} />
  <input
    type="color"
    value={highlightColor}
    onMouseDown={(e) => e.preventDefault()}
    onChange={(e) => { setHighlightColor(e.target.value); editor.chain().focus().setHighlight({ color: e.target.value }).run(); }}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }}
  />
</label>
        <button type="button" title="글머리 목록" onMouseDown={(e) => e.preventDefault()} style={btnStyle(state.bulletList)} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="2" cy="3" r="1.2" fill="currentColor" /><circle cx="2" cy="8" r="1.2" fill="currentColor" /><circle cx="2" cy="13" r="1.2" fill="currentColor" /><line x1="6" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <button type="button" title="번호 목록" onMouseDown={(e) => e.preventDefault()} style={btnStyle(state.orderedList)} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><text x="0" y="5" fontSize="5" fill="currentColor">1</text><text x="0" y="10" fontSize="5" fill="currentColor">2</text><text x="0" y="15" fontSize="5" fill="currentColor">3</text><line x1="6" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <button type="button" title="내어쓰기" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().outdent().run()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="2" x2="15" y2="2" stroke="currentColor" strokeWidth="1.5" /><line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5" /><path d="M5 5.5 L1.5 8 L5 10.5 Z" fill="currentColor" /></svg>
        </button>
        <button type="button" title="들여쓰기" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().indent().run()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="2" x2="15" y2="2" stroke="currentColor" strokeWidth="1.5" /><line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" /><line x1="6" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5" /><path d="M1 5.5 L4.5 8 L1 10.5 Z" fill="currentColor" /></svg>
        </button>

        <button type="button" title="링크" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={setLink}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 9.5 L9.5 6.5" /><path d="M7 4.5 L9 2.5 A2.5 2.5 0 0 1 12.5 6 L11 7.5" /><path d="M9 11.5 L7 13.5 A2.5 2.5 0 0 1 3.5 10 L5 8.5" /></svg>
        </button>
        <button type="button" title="이미지" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? "..." : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><circle cx="5.5" cy="6" r="1.3" fill="currentColor" stroke="none" /><path d="M2 12 L6 8 L9 11 L11 9 L14.5 12.5" /></svg>}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageSelect} />

        <button type="button" title="이미지 좌측" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="1" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.3" /><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.3" /></svg>
        </button>
        <button type="button" title="이미지 가운데" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="4.5" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.3" /><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.3" /></svg>
        </button>
        <button type="button" title="이미지 우측" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}>
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="8" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.3" /><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.3" /></svg>
        </button>

        <button type="button" title="표 삽입" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1.5" y="2.5" width="13" height="11" /><line x1="1.5" y1="6.5" x2="14.5" y2="6.5" /><line x1="1.5" y1="10.5" x2="14.5" y2="10.5" /><line x1="6" y1="2.5" x2="6" y2="13.5" /><line x1="10.5" y1="2.5" x2="10.5" y2="13.5" /></svg>
        </button>
        <button type="button" title="열 추가" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().addColumnAfter().run()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="3" width="9" height="10" /><line x1="1" y1="8" x2="10" y2="8" /><line x1="5.5" y1="3" x2="5.5" y2="13" /><line x1="13" y1="5" x2="13" y2="11" strokeWidth="1.8" /><line x1="10" y1="8" x2="16" y2="8" strokeWidth="1.8" /></svg>
        </button>
        <button type="button" title="행 추가" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().addRowAfter().run()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="14" height="9" /><line x1="1" y1="5.5" x2="15" y2="5.5" /><line x1="8" y1="1" x2="8" y2="10" /><line x1="5" y1="13" x2="11" y2="13" strokeWidth="1.8" /><line x1="8" y1="10" x2="8" y2="16" strokeWidth="1.8" /></svg>
        </button>
        <button type="button" title="표 삭제" onMouseDown={(e) => e.preventDefault()} style={btnStyle(false)} onClick={() => editor.chain().focus().deleteTable().run()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1.5" y="2.5" width="13" height="11" /><line x1="1.5" y1="6.5" x2="14.5" y2="6.5" /><line x1="6" y1="2.5" x2="6" y2="13.5" /><line x1="4" y1="9" x2="8" y2="13" strokeWidth="1.6" stroke="#f44336" /><line x1="8" y1="9" x2="4" y2="13" strokeWidth="1.6" stroke="#f44336" /></svg>
        </button>
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}