import { TableRow } from "@tiptap/extension-table-row";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const ResizableTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.height || null,
        renderHTML: (attributes: any) => (attributes.height ? { style: `height:${attributes.height}` } : {}),
      },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("rowResizeHandles"),
        view(editorView) {
          let handles: HTMLElement[] = [];
          let isDragging = false;

          const cleanup = () => {
            handles.forEach((h) => h.remove());
            handles = [];
          };

          const render = () => {
            if (isDragging) return;
            cleanup();
            const dom = editorView.dom as HTMLElement;
            const wrapper = dom.parentElement;
            if (!wrapper) return;
            wrapper.style.position = "relative";

            const rows = dom.querySelectorAll("tr");
            rows.forEach((rowEl) => {
              const row = rowEl as HTMLElement;

              const handle = document.createElement("div");
              handle.className = "row-resize-handle";
              handle.style.position = "absolute";
              handle.style.left = "0";
              handle.style.right = "0";
              handle.style.height = "6px";
              handle.style.cursor = "row-resize";
              handle.style.zIndex = "20";

              const rect = row.getBoundingClientRect();
              const domRect = dom.getBoundingClientRect();
              handle.style.top = `${rect.bottom - domRect.top - 3}px`;

              let startY = 0;
              let startHeight = 0;
              let startHandleTop = 0;
              let capturedRowPos: number | null = null;

              const onMouseMove = (e: MouseEvent) => {
                const delta = e.clientY - startY;
                const newHeight = Math.max(24, startHeight + delta);
                handle.style.top = `${startHandleTop + delta}px`;
                if (capturedRowPos !== null) {
                  editor.commands.command(({ tr }) => {
                    tr.setNodeAttribute(capturedRowPos as number, "height", `${newHeight}px`);
                    return true;
                  });
                }
              };

              const onMouseUp = () => {
                isDragging = false;
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              };

              handle.addEventListener("mousedown", (e) => {
                e.preventDefault();
                e.stopPropagation();
                isDragging = true;
                startY = e.clientY;
                startHeight = row.getBoundingClientRect().height;
                startHandleTop = parseFloat(handle.style.top) || 0;

                capturedRowPos = null;
                const pos = editorView.posAtDOM(row, 0);
                if (pos >= 0) {
                  const $pos = editorView.state.doc.resolve(pos);
                  for (let d = $pos.depth; d > 0; d--) {
                    if ($pos.node(d).type.name === "tableRow") {
                      capturedRowPos = $pos.before(d);
                      break;
                    }
                  }
                }

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
              });

              wrapper.appendChild(handle);
              handles.push(handle);
            });
          };

          render();

          return {
            update: () => render(),
            destroy: () => cleanup(),
          };
        },
      }),
    ];
  },
});