import { Node } from "@tiptap/core";

export const RawHtmlBlock = Node.create({
  name: "rawHtmlBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: null },
      height: { default: null },
      frameborder: { default: null },
      allow: { default: null },
      allowfullscreen: { default: null },
      style: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "iframe" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs: Record<string, string> = {};
    Object.entries(HTMLAttributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) attrs[key] = String(value);
    });
    return ["iframe", attrs];
  },

  addNodeView() {
    return ({ node }) => {
      const iframe = document.createElement("iframe");
      Object.entries(node.attrs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          iframe.setAttribute(key, String(value));
        }
      });
      const dom = document.createElement("div");
      dom.setAttribute("contenteditable", "false");
      dom.appendChild(iframe);
      return { dom };
    };
  },
});