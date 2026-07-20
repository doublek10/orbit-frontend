"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-signal-amber text-graphite-950 hover:bg-[#eab35c]",
    ghost: "bg-transparent text-paper border border-graphite-600 hover:border-signal-amber",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
