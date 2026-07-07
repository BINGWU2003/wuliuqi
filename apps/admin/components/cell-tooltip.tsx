"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@wuliuqi/ui/components/tooltip";
import { cn } from "@wuliuqi/ui/lib/utils";

export const TABLE_ACTION_HEAD_CLASS =
  "sticky right-0 z-30 min-w-44 bg-card text-right whitespace-nowrap shadow-[-1px_0_0_var(--border)]";
export const TABLE_ACTION_CELL_CLASS =
  "sticky right-0 z-10 min-w-44 bg-card shadow-[-1px_0_0_var(--border)]";

type CellTooltipProps = {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
  content: ReactNode;
  contentClassName?: string;
};

export function CellTooltip({
  asChild = false,
  children,
  className,
  content,
  contentClassName,
}: CellTooltipProps) {
  const hasContent =
    content !== null &&
    content !== undefined &&
    (typeof content !== "string" || content.trim().length > 0);
  const trigger = asChild ? (
    children
  ) : (
    <span className={cn("block min-w-0 truncate", className)}>
      {children}
    </span>
  );

  if (!hasContent) {
    return trigger;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        className={cn("max-w-xs break-words normal-case", contentClassName)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
