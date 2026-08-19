import type { TOCItemType } from "fumadocs-core/toc";
import GithubSlugger from "github-slugger";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const headingPattern = /^(#{2,4})[\t ]+(.+?)[\t ]*#*[\t ]*$/gm;

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        a({ children, href }) {
          const external =
            href?.startsWith("http://") || href?.startsWith("https://");

          return (
            <a
              href={href}
              rel={external ? "noreferrer" : undefined}
              target={external ? "_blank" : undefined}
            >
              {children}
            </a>
          );
        },
      }}
      rehypePlugins={[rehypeSlug]}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
}

export function getMarkdownToc(content: string): TOCItemType[] {
  const slugger = new GithubSlugger();

  return Array.from(content.matchAll(headingPattern), (match) => {
    const rawTitle = match[2] ?? "";
    const title = markdownHeadingText(rawTitle);

    return {
      title,
      url: `#${slugger.slug(title)}`,
      depth: (match[1]?.length ?? 2) - 1,
    };
  });
}

function markdownHeadingText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
