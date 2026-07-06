import type { ReactNode } from "react";

export function MarkdownContent({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 text-[15px] leading-7">
      {blocks.map((block, index) => (
        <MarkdownBlock block={block} key={`${index}-${block.slice(0, 12)}`} />
      ))}
    </div>
  );
}

function MarkdownBlock({ block }: { block: string }) {
  if (block.startsWith("### ")) {
    return <h3 className="text-lg font-semibold tracking-normal">{block.slice(4)}</h3>;
  }

  if (block.startsWith("## ")) {
    return <h2 className="text-xl font-semibold tracking-normal">{block.slice(3)}</h2>;
  }

  if (block.startsWith("# ")) {
    return <h1 className="text-2xl font-bold tracking-normal">{block.slice(2)}</h1>;
  }

  if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
    return (
      <ul className="list-disc space-y-2 pl-5">
        {block.split("\n").map((line) => (
          <li key={line}>{inlineCode(line.trim().slice(2))}</li>
        ))}
      </ul>
    );
  }

  return <p className="text-foreground/90">{inlineCode(block)}</p>;
}

function inlineCode(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]"
          key={`${index}-${part}`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
