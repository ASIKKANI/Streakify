import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, fullWidth, id, ...props }, ref) => {
        return (
            <div className={clsx("flex flex-col gap-2", fullWidth && "w-full")}>
                {label && (
                    <label htmlFor={id} className="text-sm font-bold text-white">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={twMerge(
                        "h-12 w-full rounded bg-[#121212] border border-[#282828] px-4 text-white placeholder-gray-500 transition-colors hover:border-[#404040] focus:border-white focus:outline-none focus:ring-0",
                        error && "border-red-500 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;
