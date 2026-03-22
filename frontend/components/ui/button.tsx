import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "default" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          
          // Variants
          variant === "primary" && 
            "bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:from-blue-700 hover:to-orange-600",
          variant === "secondary" && 
            "bg-orange-500 text-white hover:bg-orange-600",
          variant === "outline" && 
            "border border-gray-300 bg-transparent hover:bg-gray-100",
          variant === "ghost" && 
            "hover:bg-gray-100",
          variant === "link" && 
            "text-blue-600 underline-offset-4 hover:underline",
          
          // Sizes
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 px-3 text-sm",
          size === "lg" && "h-11 px-8 text-lg",
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button }; 