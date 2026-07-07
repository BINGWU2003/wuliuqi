"use client";

import { useEffect } from "react";

type ScrollLockSnapshot = {
  bodyLeft: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
  bodyPosition: string;
  bodyRight: string;
  bodyTop: string;
  bodyWidth: string;
  htmlOverflow: string;
  scrollX: number;
  scrollY: number;
};

let lockCount = 0;
let snapshot: ScrollLockSnapshot | null = null;

function lockScroll() {
  if (typeof window === "undefined") {
    return;
  }

  if (lockCount === 0) {
    const html = document.documentElement;
    const body = document.body;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const bodyPaddingRight =
      Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    snapshot = {
      bodyLeft: body.style.left,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      bodyPosition: body.style.position,
      bodyRight: body.style.right,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
      scrollX,
      scrollY,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.right = "0";
    body.style.width = "100%";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    }
  }

  lockCount += 1;
}

function unlockScroll() {
  if (typeof window === "undefined" || lockCount === 0) {
    return;
  }

  lockCount -= 1;

  if (lockCount > 0 || !snapshot) {
    return;
  }

  const html = document.documentElement;
  const body = document.body;
  const { scrollX, scrollY } = snapshot;

  html.style.overflow = snapshot.htmlOverflow;
  body.style.overflow = snapshot.bodyOverflow;
  body.style.position = snapshot.bodyPosition;
  body.style.top = snapshot.bodyTop;
  body.style.left = snapshot.bodyLeft;
  body.style.right = snapshot.bodyRight;
  body.style.width = snapshot.bodyWidth;
  body.style.paddingRight = snapshot.bodyPaddingRight;

  snapshot = null;
  window.scrollTo(scrollX, scrollY);
}

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      return;
    }

    lockScroll();

    return () => unlockScroll();
  }, [locked]);
}
