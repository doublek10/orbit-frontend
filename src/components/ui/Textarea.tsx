"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 font-mono text-xs text-paper placeholder:text-graphite-600 focus:border-signal-amber ${className}`}
        {...props}
      />
    );
  },
);
