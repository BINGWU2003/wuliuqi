"use client";

import { Button, type ButtonProps } from "@wuliuqi/ui/components/button";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import type { ReactNode } from "react";

type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  loadingLabel?: ReactNode;
};

export function LoadingButton({
  children,
  disabled,
  loading = false,
  loadingLabel,
  ...props
}: LoadingButtonProps) {
  return (
    <Button aria-busy={loading || undefined} disabled={disabled || loading} {...props}>
      {loading ? <Spinner /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}
