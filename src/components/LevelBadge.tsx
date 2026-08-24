"use client";

const TIERS: [string, string][] = [
  ["새싹", "#22c55e"], ["브론즈", "#b06b36"], ["실버", "#94a3b8"], ["골드", "#e0a106"],
  ["에메랄드", "#059669"], ["사파이어", "#2563eb"], ["자수정", "#7c3aed"],
  ["루비", "#e11d48"], ["옵시디언", "#d4a843"], ["다이아", "#38bdf8"],
];

function cumulativeForLevel(level: number): number {
  return 50 * (level - 1) * (level + 6);
}

export function getLevel(points: number): number {
  const p = points || 0;
  let level = 1;
  for (let l = 2; l <= 99; l++) {
    if (p >= cumulativeForLevel(l)) level = l;
    else break;
  }
  return level;
}

export function LevelBadgeSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="lvg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#86efac" /><stop offset="1" stopColor="#16a34a" /></linearGradient>
        <linearGradient id="lvg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e3a978" /><stop offset="1" stopColor="#95552a" /></linearGradient>
        <linearGradient id="lvg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fafc" /><stop offset="1" stopColor="#8fa0b5" /></linearGradient>
        <linearGradient id="lvg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe680" /><stop offset="1" stopColor="#d68806" /></linearGradient>
        <linearGradient id="lvg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6ee7b7" /><stop offset="1" stopColor="#047857" /></linearGradient>
        <linearGradient id="lvg6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#93c5fd" /><stop offset="1" stopColor="#1d4ed8" /></linearGradient>
        <linearGradient id="lvg7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e2c4ff" /><stop offset="1" stopColor="#6d28d9" /></linearGradient>
        <linearGradient id="lvg8" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fda4af" /><stop offset="1" stopColor="#be123c" /></linearGradient>
        <linearGradient id="lvg9" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4b5a6e" /><stop offset="1" stopColor="#0b1018" /></linearGradient>
        <linearGradient id="lvg9b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6dd97" /><stop offset="1" stopColor="#b8892f" /></linearGradient>
        <linearGradient id="lvg10" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a5f3fc" /><stop offset=".45" stopColor="#c4b5fd" /><stop offset="1" stopColor="#fbcfe8" /></linearGradient>
        <linearGradient id="lvg11" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd166" /><stop offset=".5" stopColor="#ff5d8f" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient>
        <linearGradient id="lvgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b8c0cb" /><stop offset="1" stopColor="#6b7480" /></linearGradient>

        <symbol id="lv-t1" viewBox="0 0 24 24">
          <path d="M12 21.5v-7.6" stroke="#15803d" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M12.6 14.2c-.3-3.4 1.9-6.3 5.7-6.9.7 3.7-1.7 6.7-5.7 6.9z" fill="url(#lvg1)" />
          <path d="M11.4 17.1c-2.9.1-5.2-1.8-5.6-4.9 3.3-.4 5.6 1.5 5.6 4.9z" fill="url(#lvg1)" opacity=".85" />
        </symbol>
        <symbol id="lv-t2" viewBox="0 0 24 24">
          <path d="M12 2.2 4.2 5.4v6.2c0 4.7 3.2 8.7 7.8 10.2 4.6-1.5 7.8-5.5 7.8-10.2V5.4L12 2.2z" fill="url(#lvg2)" stroke="rgba(0,0,0,.3)" strokeWidth="1" />
          <path d="M12 4.2v15.4c-3.3-1.4-5.6-4.5-5.6-8.1V6.6L12 4.2z" fill="#fff" opacity=".18" />
        </symbol>
        <symbol id="lv-t3" viewBox="0 0 24 24">
          <path d="M12 2.2 4.2 5.4v6.2c0 4.7 3.2 8.7 7.8 10.2 4.6-1.5 7.8-5.5 7.8-10.2V5.4L12 2.2z" fill="url(#lvg3)" stroke="rgba(40,55,75,.45)" strokeWidth="1" />
          <path d="M12 4.2v15.4c-3.3-1.4-5.6-4.5-5.6-8.1V6.6L12 4.2z" fill="#fff" opacity=".45" />
        </symbol>
        <symbol id="lv-t4" viewBox="0 0 24 24">
          <path d="M12 2.2 4.2 5.4v6.2c0 4.7 3.2 8.7 7.8 10.2 4.6-1.5 7.8-5.5 7.8-10.2V5.4L12 2.2z" fill="url(#lvg4)" stroke="rgba(90,55,0,.45)" strokeWidth="1" />
          <path d="M12 4.2v15.4c-3.3-1.4-5.6-4.5-5.6-8.1V6.6L12 4.2z" fill="#fff" opacity=".35" />
        </symbol>
        <symbol id="lv-t5" viewBox="0 0 24 24">
          <path d="m12 1.8 3.1 6.4 7 1-5.1 4.9 1.2 6.9L12 17.7 5.8 21l1.2-6.9L1.9 9.2l7-1L12 1.8z" fill="url(#lvg5)" stroke="rgba(0,50,35,.4)" strokeWidth="1" strokeLinejoin="round" />
          <path d="m12 1.8 3.1 6.4 7 1-5.1 4.9L12 12V1.8z" fill="#fff" opacity=".2" />
        </symbol>
        <symbol id="lv-t6" viewBox="0 0 24 24">
          <path d="m12 1.8 3.1 6.4 7 1-5.1 4.9 1.2 6.9L12 17.7 5.8 21l1.2-6.9L1.9 9.2l7-1L12 1.8z" fill="url(#lvg6)" stroke="rgba(0,25,80,.45)" strokeWidth="1" strokeLinejoin="round" />
          <path d="m12 1.8 3.1 6.4 7 1-5.1 4.9L12 12V1.8z" fill="#fff" opacity=".22" />
        </symbol>
        <symbol id="lv-t7" viewBox="0 0 24 24">
          <path d="m12 1.8 3.1 6.4 7 1-5.1 4.9 1.2 6.9L12 17.7 5.8 21l1.2-6.9L1.9 9.2l7-1L12 1.8z" fill="url(#lvg7)" stroke="rgba(45,10,90,.45)" strokeWidth="1" strokeLinejoin="round" />
          <path d="m12 1.8 3.1 6.4 7 1-5.1 4.9L12 12V1.8z" fill="#fff" opacity=".25" />
        </symbol>
        <symbol id="lv-t8" viewBox="0 0 24 24">
          <path d="M2.4 6.6 7 10.4l4-6.9c.4-.7 1.5-.7 1.9 0l4 6.9 4.7-3.8c.8-.7 2 .1 1.7 1.1l-3 10.6H3.7L.7 7.7c-.3-1 .9-1.8 1.7-1.1z" fill="url(#lvg8)" stroke="rgba(90,0,25,.4)" strokeWidth="1" strokeLinejoin="round" />
          <rect x="3.6" y="19.4" width="16.8" height="2.9" rx="1.1" fill="url(#lvg8)" stroke="rgba(90,0,25,.4)" strokeWidth="1" />
          <circle cx="12" cy="8.6" r="1.6" fill="#fff" opacity=".6" />
        </symbol>
        <symbol id="lv-t9" viewBox="0 0 24 24">
          <path d="M2.4 6.6 7 10.4l4-6.9c.4-.7 1.5-.7 1.9 0l4 6.9 4.7-3.8c.8-.7 2 .1 1.7 1.1l-3 10.6H3.7L.7 7.7c-.3-1 .9-1.8 1.7-1.1z" fill="url(#lvg9)" stroke="url(#lvg9b)" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="3.6" y="19.4" width="16.8" height="2.9" rx="1.1" fill="url(#lvg9)" stroke="url(#lvg9b)" strokeWidth="1.4" />
          <circle cx="12" cy="8.4" r="1.7" fill="url(#lvg9b)" />
        </symbol>
        <symbol id="lv-t10" viewBox="0 0 24 24">
          <path d="M6.6 2.4h10.8l4.4 6.3L12 21.8 2.2 8.7l4.4-6.3z" fill="url(#lvg10)" stroke="rgba(60,90,150,.55)" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M6.6 2.4 8.8 8.7 12 21.8 15.2 8.7l2.2-6.3M2.2 8.7h19.6" stroke="rgba(255,255,255,.85)" strokeWidth="1" fill="none" />
        </symbol>
        <symbol id="lv-legend" viewBox="0 0 24 24">
          <path d="M12 .6 13.6 5 18 3.2l-1.4 4.5 4.6.9-3.4 3.2 3.4 3.2-4.6.9L18 20.4 13.6 18.7 12 23l-1.6-4.3L6 20.4l1.4-4.5-4.6-.9 3.4-3.2L2.8 8.6l4.6-.9L6 3.2 10.4 5 12 .6z" fill="url(#lvg11)" opacity=".4" />
          <path d="M4.1 8 7.6 10.9l3.1-5.3c.6-1 2-1 2.6 0l3.1 5.3L19.9 8c1-.8 2.4.1 2.1 1.3l-2.2 7.9H4.2L2 9.3C1.7 8.1 3.1 7.2 4.1 8z" fill="url(#lvg11)" stroke="rgba(70,20,90,.5)" strokeWidth="1" strokeLinejoin="round" />
          <rect x="4.1" y="18.1" width="15.8" height="2.7" rx="1" fill="url(#lvg11)" stroke="rgba(70,20,90,.5)" strokeWidth="1" />
          <circle cx="12" cy="9" r="1.6" fill="#fff" opacity=".85" />
        </symbol>
        <symbol id="lv-admin" viewBox="0 0 24 24">
          <path d="M19.5 13.1a7.6 7.6 0 0 0 0-2.2l2.2-1.7a.55.55 0 0 0 .1-.7l-2.1-3.6a.55.55 0 0 0-.66-.24l-2.6 1.05a7.7 7.7 0 0 0-1.87-1.08l-.4-2.76a.55.55 0 0 0-.54-.46h-4.2a.55.55 0 0 0-.54.46l-.4 2.76c-.67.26-1.3.62-1.87 1.08L3.96 4.66a.55.55 0 0 0-.66.24L1.2 8.5a.55.55 0 0 0 .1.7l2.2 1.7a7.6 7.6 0 0 0 0 2.2l-2.2 1.7a.55.55 0 0 0-.1.7l2.1 3.6c.14.24.43.34.66.24l2.6-1.05c.57.46 1.2.82 1.87 1.08l.4 2.76c.05.27.28.46.54.46h4.2c.26 0 .49-.19.54-.46l.4-2.76a7.7 7.7 0 0 0 1.87-1.08l2.6 1.05c.23.1.52 0 .66-.24l2.1-3.6a.55.55 0 0 0-.1-.7l-2.2-1.7z"
            fill="url(#lvgA)" stroke="rgba(40,48,60,.35)" strokeWidth=".8" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3.5" fill="#4b5360" />
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".9" />
        </symbol>
      </defs>
    </svg>
  );
}

export default function LevelBadge({ level, size, isAdmin }: { level?: number; size?: "sm" | "lg"; isAdmin?: boolean }) {
  const cls = "lv-badge" + (size ? ` lv-badge--${size}` : "");

  if (isAdmin) {
    return (
      <svg className={cls} data-tier="admin" viewBox="0 0 32 32" role="img" aria-label="관리자">
        <use href="#lv-admin" x="2.5" y="2.5" width="27" height="27" />
      </svg>
    );
  }

  const l = Math.min(99, Math.max(1, Math.floor(level || 1)));
  const legend = l === 99;
  const i = Math.min(10, Math.floor(l / 10) + 1);
  const tier = legend ? "legend" : `t${i}`;
  const name = legend ? "레전드" : TIERS[i - 1][0];
  const ring = legend ? "url(#lvg11)" : TIERS[i - 1][1];
  const steps = Math.min(10, (l % 10) + 1);
  const dash = new Array(steps).fill("7 3").join(" ") + ` 0 ${100 - steps * 10}`;

  return (
    <svg className={cls} data-tier={tier} viewBox="0 0 32 32" role="img" aria-label={`레벨 ${l} ${name}`}>
      <circle cx="16" cy="16" r="14.2" fill="none" stroke="rgba(130,140,158,.32)" strokeWidth="2.2" pathLength={100} strokeDasharray="7 3" strokeLinecap="round" transform="rotate(-90 16 16)" />
      <circle cx="16" cy="16" r="14.2" fill="none" stroke={ring} strokeWidth="2.2" pathLength={100} strokeDasharray={dash} strokeLinecap="round" transform="rotate(-90 16 16)" />
      <use href={`#lv-${tier}`} x="6.5" y="6.5" width="19" height="19" />
    </svg>
  );
}