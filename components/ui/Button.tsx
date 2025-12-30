import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, fullWidth, children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";

        const variants = {
            primary: "bg-spotify-green text-black hover:scale-105 active:scale-100 focus:ring-spotify-green",
            secondary: "bg-transparent border border-gray-500 text-white hover:border-white hover:scale-105 active:scale-100",
            ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/10",
            danger: "bg-red-600 text-white hover:bg-red-700",
        };

        const sizes = {
            sm: "h-8 px-4 text-xs",
            md: "h-12 px-8 text-sm uppercase tracking-widest",
            lg: "h-14 px-10 text-base",
        };

        return (
            <button
                ref={ref}
                className={twMerge(baseStyles, variants[variant], sizes[size], fullWidth && "w-full", className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
export default Button;
