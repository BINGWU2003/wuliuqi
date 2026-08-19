"use client";

import type { KnowledgeSearchResult } from "@wuliuqi/types";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SearchItemType,
} from "fumadocs-ui/components/dialog/search";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SearchResponse = {
  success: true;
  data: KnowledgeSearchResult[];
};

export function KnowledgeSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [kbSlug, setKbSlug] = useState(() => slugFromPath(pathname));
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<SearchItemType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const querySlug = new URLSearchParams(window.location.search).get("kbSlug");
    setKbSlug(slugFromPath(pathname) || querySlug || "buyer-help");
  }, [pathname]);

  useEffect(() => {
    const query = search.trim();

    if (!open || !query) {
      setItems(null);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(
          `/api/search?kbSlug=${encodeURIComponent(kbSlug)}&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("搜索服务暂时不可用");
        }

        const payload = (await response.json()) as SearchResponse;
        setItems(payload.data.map(toSearchItem));
      } catch (requestError) {
        if (!(
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )) {
          setItems([]);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [kbSlug, open, search]);

  const fullResultsHref = `/search?kbSlug=${encodeURIComponent(kbSlug)}&q=${encodeURIComponent(search.trim())}`;

  return (
    <SearchDialog
      isLoading={loading}
      onOpenChange={onOpenChange}
      onSearchChange={setSearch}
      open={open}
      search={search}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput placeholder="搜索文章和常见问题…" />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          Empty={() => (
            <div className="py-12 text-center text-sm text-fd-muted-foreground">
              {error
                ? "搜索服务暂时不可用，请稍后再试。"
                : "没有找到相关内容。"}
            </div>
          )}
          items={items}
        />
        {search.trim() ? (
          <SearchDialogFooter className="flex justify-end">
            <Link
              className="text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              href={fullResultsHref}
              onClick={() => onOpenChange(false)}
            >
              查看完整搜索结果
            </Link>
          </SearchDialogFooter>
        ) : null}
      </SearchDialogContent>
    </SearchDialog>
  );
}

function slugFromPath(pathname: string): string {
  const match = /^\/kb\/([^/]+)/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function toSearchItem(result: KnowledgeSearchResult): SearchItemType {
  return {
    id: `${result.type}-${result.id}`,
    type: "page",
    content: result.title,
    url: result.href,
    breadcrumbs: [
      result.type === "faq" ? "常见问题" : "帮助文章",
      ...(result.categoryName ? [result.categoryName] : []),
    ],
  };
}
