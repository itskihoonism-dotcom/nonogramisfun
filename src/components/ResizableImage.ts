import Image from "@tiptap/extension-image";

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes: any) => (attributes.width ? { style: `width:${attributes.width};` } : {}),
      },
      align: {
        default: "left",
        renderHTML: (attributes: any) => {
          const align = attributes.align || "left";
          const margin =
            align === "center" ? "margin-left:auto;margin-right:auto;" :
            align === "right" ? "margin-left:auto;margin-right:0;" :
            "margin-left:0;margin-right:auto;";
          return { style: `display:block;max-width:100%;${margin}` };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement("div");
      container.style.position = "relative";
      container.style.display = "table";
      container.style.maxWidth = "100%";

      const applyAlign = (align: string) => {
        if (align === "center") {
          container.style.marginLeft = "auto";
          container.style.marginRight = "auto";
        } else if (align === "right") {
          container.style.marginLeft = "auto";
          container.style.marginRight = "0";
        } else {
          container.style.marginLeft = "0";
          container.style.marginRight = "auto";
        }
      };

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.style.display = "block";
      img.style.maxWidth = "100%";
      if (node.attrs.width) img.style.width = node.attrs.width;
      applyAlign(node.attrs.align || "left");

      container.appendChild(img);

      const handle = document.createElement("div");
      handle.style.position = "absolute";
      handle.style.right = "-4px";
      handle.style.bottom = "-4px";
      handle.style.width = "12px";
      handle.style.height = "12px";
      handle.style.background = "#2196F3";
      handle.style.borderRadius = "2px";
      handle.style.cursor = "nwse-resize";
      container.appendChild(handle);

      let startX = 0;
      let startWidth = 0;

      const onMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (e.clientX - startX);
        if (newWidth > 40) img.style.width = `${newWidth}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (typeof getPos === "function") {
          const pos = getPos();
          if (typeof pos === "number") {
            editor.commands.command(({ tr }) => {
              tr.setNodeAttribute(pos, "width", img.style.width);
              return true;
            });
          }
        }
      };

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = img.getBoundingClientRect().width;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "image") return false;
          if (updatedNode.attrs.width) img.style.width = updatedNode.attrs.width;
          applyAlign(updatedNode.attrs.align || "left");
          return true;
        },
      };
    };
  },
});