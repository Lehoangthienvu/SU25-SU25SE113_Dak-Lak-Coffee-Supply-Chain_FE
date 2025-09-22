"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 aria-invalid:ring-red-500/20 cursor-pointer transition",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-orange-100 to-orange-100 hover:from-orange-400 hover:to-amber-400 text-orange-500 hover:text-white shadow-sm hover:shadow-md active:scale-95",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md focus-visible:ring-red-500/20 active:scale-95",
        destructiveGradient:
          "bg-gradient-to-r from-red-100 to-red-100 hover:from-red-400 hover:to-red-600 text-red-500 hover:text-white shadow-sm hover:shadow-md active:scale-95",
        approveGradient:
          "bg-gradient-to-r from-green-100 to-green-100 hover:from-green-500 hover:to-green-400 text-green-500 hover:text-white shadow-sm hover:shadow-md active:scale-95",
        outline:
          "border border-orange-200 bg-white shadow-sm hover:bg-orange-50 hover:border-orange-300 hover:shadow-md active:scale-95",
        secondary:
          "bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 hover:shadow-md active:scale-95",
        secondaryGradient:
          "bg-gradient-to-r from-gray-100 to-gray-100 hover:from-gray-400 hover:to-gray-500 text-gray-500 hover:text-white shadow-sm hover:shadow-md active:scale-95",
        ghost:
          "hover:bg-orange-50 hover:text-orange-700 active:scale-95",
        link: "text-orange-600 underline-offset-4 hover:underline hover:text-orange-700",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4 text-base",
        icon: "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };