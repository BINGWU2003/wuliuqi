"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { cn } from "@wuliuqi/ui/lib/utils";
import { Bold, ListOrdered, Pilcrow } from "lucide-react";
import { useEffect, useRef } from "react";

export function RichTextEditor({
  readOnly = false,
  value,
  onChange,
}: {
  readOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  function command(name: string) {
    if (readOnly) {
      return;
    }

    document.execCommand(name);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      {!readOnly ? (
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1">
        <Button
          aria-label="加粗"
          size="icon"
          title="加粗"
          type="button"
          variant="ghost"
          onClick={() => command("bold")}
        >
          <Bold size={16} />
        </Button>
        <Button
          aria-label="有序列表"
          size="icon"
          title="有序列表"
          type="button"
          variant="ghost"
          onClick={() => command("insertOrderedList")}
        >
          <ListOrdered size={16} />
        </Button>
        <Button
          aria-label="清除格式"
          size="icon"
          title="清除格式"
          type="button"
          variant="ghost"
          onClick={() => command("removeFormat")}
        >
          <Pilcrow size={16} />
        </Button>
      </div>
      ) : null}
      <div
        ref={editorRef}
        className={cn(
          "min-h-36 break-words px-3 py-2 text-sm leading-7 outline-none",
          "empty:before:text-muted-foreground empty:before:content-['请输入账号描述']",
        )}
        contentEditable={!readOnly}
        role="textbox"
        suppressContentEditableWarning
        onBlur={() => {
          if (!readOnly) {
            onChange(editorRef.current?.innerHTML ?? "");
          }
        }}
        onInput={() => {
          if (!readOnly) {
            onChange(editorRef.current?.innerHTML ?? "");
          }
        }}
      />
    </div>
  );
}
