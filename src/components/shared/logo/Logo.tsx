import React from "react";
import { Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  iconType?: "sparkles" | "bot" | "none";
  showText?: boolean;
  text?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = "lg",
  iconType = "sparkles",
  showText = true,
  text = "ChatGPT Kid",
  className,
  iconClassName,
  textClassName,
}) => {
  // Define size styling maps
  const containerSizeClasses = {
    sm: "w-8 h-8 rounded-lg bg-sky-500",
    md: "w-12 h-12 bg-[#4cc2ff] rounded-2xl border-b-4 border-[#004c6b] shadow-sm",
    lg: "w-16 h-16 rounded-2xl bg-sky-500 shadow-lg",
    xl: "w-20 h-20 rounded-3xl bg-sky-500 shadow-xl",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4 text-white",
    md: "w-7 h-7 text-white",
    lg: "w-8 h-8 text-white",
    xl: "w-10 h-10 text-white",
  };

  const textSizeClasses = {
    sm: "text-xl font-black text-sky-600 whitespace-nowrap",
    md: "text-4xl font-extrabold text-[#00658d] tracking-tight",
    lg: "text-5xl font-black text-sky-600",
    xl: "text-6xl font-black text-sky-600",
  };

  const gapClasses = {
    sm: "gap-2",
    md: "gap-3 mb-2",
    lg: "gap-4",
    xl: "gap-5",
  };

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      {iconType !== "none" && (
        <div
          className={cn(
            "flex items-center justify-center shrink-0 transition-transform hover:scale-105 duration-200",
            containerSizeClasses[size],
            iconClassName
          )}
        >
          {iconType === "sparkles" ? (
            <Sparkles className={iconSizeClasses[size]} />
          ) : (
            <Bot className={iconSizeClasses[size]} />
          )}
        </div>
      )}
      {showText && <h1 className={cn(textSizeClasses[size], textClassName)}>{text}</h1>}
    </div>
  );
};

export default Logo;
