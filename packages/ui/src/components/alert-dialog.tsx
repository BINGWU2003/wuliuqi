"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import type {
  AlertDialogBackdropProps,
  AlertDialogCloseProps,
  AlertDialogDescriptionProps,
  AlertDialogPopupProps,
  AlertDialogPortalProps,
  AlertDialogRootProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps,
} from "@base-ui/react/alert-dialog";
import * as React from "react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

type AsChildProps = {
  asChild?: boolean;
};

type AlertDialogCloseClickEvent = Parameters<
  NonNullable<AlertDialogCloseProps["onClick"]>
>[0];

function renderFromAsChild(
  asChild: boolean | undefined,
  children: React.ReactNode,
) {
  return asChild && React.isValidElement(children) ? children : undefined;
}

function AlertDialog<Payload>({
  ...props
}: AlertDialogRootProps<Payload>) {
  return <AlertDialogPrimitive.Root {...props} />;
}

function AlertDialogTrigger<Payload>({
  asChild,
  children,
  render,
  ...props
}: AlertDialogTriggerProps<Payload> & AsChildProps) {
  return (
    <AlertDialogPrimitive.Trigger
      render={render ?? renderFromAsChild(asChild, children)}
      {...props}
    >
      {asChild ? undefined : children}
    </AlertDialogPrimitive.Trigger>
  );
}

function AlertDialogPortal({ ...props }: AlertDialogPortalProps) {
  return <AlertDialogPrimitive.Portal {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}: Omit<AlertDialogBackdropProps, "className"> & { className?: string }) {
  return (
    <AlertDialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[ending-style]:animate-out data-[starting-style]:animate-in",
        className,
      )}
      {...props}
    />
  );
}

type AlertDialogContentProps = Omit<AlertDialogPopupProps, "className"> & {
  className?: string;
  size?: "default" | "sm";
};

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: AlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none data-[ending-style]:animate-out data-[starting-style]:animate-in",
          size === "sm" ? "max-w-sm" : "max-w-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: Omit<AlertDialogTitleProps, "className"> & { className?: string }) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: Omit<AlertDialogDescriptionProps, "className"> & { className?: string }) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  asChild,
  children,
  className,
  onClick,
  render,
  ...props
}: Omit<AlertDialogCloseProps, "className"> &
  AsChildProps & {
    className?: string;
  }) {
  function handleClick(event: AlertDialogCloseClickEvent) {
    onClick?.(event);

    if (event.defaultPrevented) {
      event.preventBaseUIHandler();
    }
  }

  return (
    <AlertDialogPrimitive.Close
      className={cn(buttonVariants(), className)}
      onClick={handleClick}
      render={render ?? renderFromAsChild(asChild, children)}
      {...props}
    >
      {asChild ? undefined : children}
    </AlertDialogPrimitive.Close>
  );
}

function AlertDialogCancel({
  asChild,
  children,
  className,
  onClick,
  render,
  ...props
}: Omit<AlertDialogCloseProps, "className"> &
  AsChildProps & {
    className?: string;
  }) {
  function handleClick(event: AlertDialogCloseClickEvent) {
    onClick?.(event);

    if (event.defaultPrevented) {
      event.preventBaseUIHandler();
    }
  }

  return (
    <AlertDialogPrimitive.Close
      className={cn(buttonVariants({ variant: "outline" }), className)}
      onClick={handleClick}
      render={render ?? renderFromAsChild(asChild, children)}
      {...props}
    >
      {asChild ? undefined : children}
    </AlertDialogPrimitive.Close>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
