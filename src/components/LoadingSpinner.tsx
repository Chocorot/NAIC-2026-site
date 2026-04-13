"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "current" | "primary" | "white";
}

export default function LoadingSpinner({
  size = "md",
  className = "",
  color = "current",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
    xl: "w-16 h-16 border-4",
  };

  const colorClasses = {
    current: "border-current border-t-transparent",
    primary: "border-blue-600 border-t-transparent dark:border-blue-400",
    white: "border-white border-t-transparent",
  };

  return (
    <div
      className={`rounded-full animate-spin transition-all ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}
