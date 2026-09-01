import sanitizeHtml from "sanitize-html";

export function sanitizeContent(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
      "h1", "h2", "h3", "h4",
      "ul", "ol", "li", "a", "img", "blockquote", "code", "pre",
      "span", "div",
      "table", "thead", "tbody", "tr", "th", "td",
      "iframe"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "style"],
      span: ["style"],
      div: ["style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      table: ["style"],
      tr: ["style"],
      td: ["style", "colspan", "rowspan"],
      th: ["style", "colspan", "rowspan"],
      iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "referrerpolicy", "title"],
      "*": ["class"]
    },
    allowedStyles: {
      "*": {
        "color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\([\d\s,]+\)$/],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\([\d\s,]+\)$/],
        "text-align": [/^(left|right|center|justify)$/],
        "font-size": [/^\d+(\.\d+)?(px|em|%)$/],
        "font-family": [/^[\w\s,'"-]+$/],
        "width": [/^\d+(\.\d+)?(px|%)$/],
        "height": [/^\d+(\.\d+)?(px|%)$/],
        "margin-left": [/^\d+(\.\d+)?(px|em)$/],
      }
    },
    allowedSchemes: ["http", "https", "data", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}