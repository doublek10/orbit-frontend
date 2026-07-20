"use client";

import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2 text-sm text-paper placeholder:text-graphite-600 focus:border-signal-amber ${className}`}
        {...props}
      />
    );
  },
);
