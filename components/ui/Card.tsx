import { HTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass";
    hoverEffect?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", hoverEffect = false, children, ...props }, ref) => {
        const variants = {
            default: "bg-[#181818] rounded-lg p-6 shadow-lg",
            glass: "glass-panel rounded-lg p-6",
        };

        const combinedClassName = twMerge(variants[variant], hoverEffect && "cursor-pointer", className);

        if (hoverEffect) {
            return (
                <motion.div
                    ref={ref}
                    className={combinedClassName}
                    whileHover={{ scale: 1.02, backgroundColor: "#282828" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    {...(props as HTMLMotionProps<"div">)}
                >
                    {children}
                </motion.div>
            );
        }

        return (
            <div
                ref={ref}
                className={combinedClassName}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
export default Card;
