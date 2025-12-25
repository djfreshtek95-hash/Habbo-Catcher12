import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 border-b-4 border-r-4 border-primary-foreground/30 active:border-0 active:translate-y-1",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-b-4 border-r-4 border-secondary-foreground/30 active:border-0 active:translate-y-1",
      outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
      ghost: "bg-transparent hover:bg-muted text-foreground",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm font-pixel text-lg",
      md: "h-12 px-6 text-base font-pixel text-xl",
      lg: "h-14 px-8 text-lg font-pixel text-2xl",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

PixelButton.displayName = "PixelButton";
