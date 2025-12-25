import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PixelCardProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "neutral" | "accent";
}

export function PixelCard({ children, className, variant = "neutral" }: PixelCardProps) {
  const variantStyles = {
    primary: "bg-primary border-primary-foreground/20 text-primary-foreground",
    secondary: "bg-secondary border-secondary-foreground/20 text-secondary-foreground",
    accent: "bg-accent border-accent-foreground/20 text-accent-foreground",
    neutral: "bg-card border-border text-card-foreground",
  };

  return (
    <div className={cn(
      "relative p-6 border-4 box-shadow-pixel transition-transform hover:-translate-y-1",
      variantStyles[variant],
      className
    )}>
      {/* Decorative pixel corners handled by CSS clip-path usually, but creating border look manually here for compatibility */}
      <div className="absolute inset-0 border-t-4 border-l-4 border-white/20 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 border-b-4 border-r-4 border-black/20 pointer-events-none mix-blend-overlay" />
      
      {children}
    </div>
  );
}
