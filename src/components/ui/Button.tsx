import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "confirm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-volt text-volt-ink border border-volt hover:brightness-110",
  secondary: "bg-transparent text-text-hi border border-border-strong hover:bg-white/5",
  ghost: "bg-transparent text-text-lo border border-transparent hover:text-text-hi",
  danger: "bg-transparent text-coral border border-coral hover:bg-coral-bg",
  confirm: "bg-mint text-[#0A2A1F] border border-mint hover:brightness-110",
};

export function Button({ variant = "secondary", className, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 font-body text-[13.5px] font-semibold transition-colors",
        disabled ? "cursor-default opacity-45" : "cursor-pointer",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
