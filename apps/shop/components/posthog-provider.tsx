"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  PostHogProvider as PostHogReactProvider,
  usePostHog,
} from "posthog-js/react";
import { ensurePostHogInitialized } from "@/lib/analytics";

export function PostHogProvider({ children }: { children: ReactNode }) {
  const enabled = Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_PROXY_READY === "true",
  );

  useEffect(() => {
    ensurePostHogInitialized();
  }, []);

  if (!enabled) {
    return children;
  }

  return (
    <PostHogReactProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogReactProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = usePostHog();
  const search = searchParams.toString();

  useEffect(() => {
    if (!pathname || !ensurePostHogInitialized()) {
      return;
    }

    const url = new URL(pathname, window.location.origin);

    if (search) {
      url.search = search;
    }

    client.capture("$pageview", { $current_url: url.toString() });
  }, [client, pathname, search]);

  return null;
}
