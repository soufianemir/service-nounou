import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline" | "default";
type ButtonSize = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  type,
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-4 focus:ring-ring/15";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-primaryForeground hover:bg-primary/90 shadow-soft",
    default: "bg-primary text-primaryForeground hover:bg-primary/90 shadow-soft",
    secondary: "bg-secondary text-secondaryForeground hover:bg-secondary/80 border border-border shadow-soft",
    outline: "border border-border bg-transparent text-foreground hover:bg-muted/60",
    ghost: "bg-transparent text-foreground hover:bg-muted/60",
    destructive: "bg-destructive text-destructiveForeground hover:bg-destructive/90 shadow-soft"
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base"
  };

  const classes = cn(base, sizes[size], variants[variant], className);

  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(children) as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(classes, child.props.className),
      ...props
    });
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
