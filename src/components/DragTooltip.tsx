"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

// 외부(PlayPuzzleClient)에서 이 툴팁을 조종할 리모컨 기능 정의
export interface TooltipHandle {
  show: (x: number, y: number, text: string) => void;
  hide: () => void;
}

const DragTooltip = forwardRef<TooltipHandle, {}>((props, ref) => {
  const divRef = useRef<HTMLDivElement>(null);

  // 부모 컴포넌트에서 쓸 수 있도록 리모컨 버튼(함수)을 연결해 줍니다.
  useImperativeHandle(ref, () => ({
    show: (x, y, text) => {
      if (divRef.current) {
        divRef.current.style.left = `${x}px`;
        divRef.current.style.top = `${y}px`;
        divRef.current.innerText = text;
        divRef.current.style.display = "block";
      }
    },
    hide: () => {
      if (divRef.current) {
        divRef.current.style.display = "none";
      }
    }
  }));

  return (
    <div
      ref={divRef}
      className="drag-tooltip" // CSS는 기존처럼 적용됩니다.
    />
  );
});

export default DragTooltip;