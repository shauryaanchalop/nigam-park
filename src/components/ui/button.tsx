import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 ease-claude hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 hover:shadow-md active:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/95 hover:shadow-md active:bg-destructive/90",
        outline: "border border-border/70 bg-card/60 backdrop-blur-sm hover:bg-accent/70 hover:border-border hover:text-accent-foreground hover:shadow-sm",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:shadow-sm",
        ghost: "hover:bg-accent/60 hover:text-accent-foreground hover:-translate-y-0",
        link: "text-primary underline-offset-4 hover:underline hover:-translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl",
        sm: "h-8.5 px-3 rounded-lg text-xs",
        lg: "h-11 px-7 rounded-xl text-base font-semibold",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
