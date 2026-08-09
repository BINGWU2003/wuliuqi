import type { ReactNode } from "react";

export function MarkdownContent({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="max-w-[72ch] space-y-6 text-[15px] leading-8">
      {blocks.map((block, index) => (
        <MarkdownBlock block={block} key={`${index}-${block.slice(0, 12)}`} />
      ))}
    </div>
  );
}

function MarkdownBlock({ block }: { block: string }) {
  if (block.startsWith("### ")) {
    return <h3 className="pt-2 text-lg font-bold tracking-tight">{block.slice(4)}</h3>;
  }

  if (block.startsWith("## ")) {
    return (
      <h2 className="border-t border-line pt-6 text-xl font-black tracking-tight">
        {block.slice(3)}
      </h2>
    );
  }

  if (block.startsWith("# ")) {
    return <h1 className="text-2xl font-black tracking-tight">{block.slice(2)}</h1>;
  }

  if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
    return (
      <ul className="list-disc space-y-2 pl-5 marker:text-brand">
        {block.split("\n").map((line) => (
          <li key={line}>{inlineCode(line.trim().slice(2))}</li>
        ))}
      </ul>
    );
  }

  return <p className="text-ink/90">{inlineCode(block)}</p>;
}

function inlineCode(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          className="rounded-sm border border-line bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em] text-brand-strong dark:text-brand"
          key={`${index}-${part}`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
