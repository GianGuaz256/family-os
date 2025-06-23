import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-2xl border-2 px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:bg-primary/80 hover:border-primary/80",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-secondary/80",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:border-destructive/80",
        success:
          "border-success bg-success text-success-foreground hover:bg-success/80 hover:border-success/80",
        info:
          "border-info bg-info text-info-foreground hover:bg-info/80 hover:border-info/80",
        warning:
          "border-warning bg-warning text-warning-foreground hover:bg-warning/80 hover:border-warning/80",
        outline: "text-foreground border-border bg-background hover:bg-muted",
        // Pastel variants
        "pastel-purple": "border-pastel-purple bg-pastel-purple text-foreground hover:bg-pastel-purple/80 hover:border-pastel-purple/80",
        "pastel-blue": "border-pastel-blue bg-pastel-blue text-foreground hover:bg-pastel-blue/80 hover:border-pastel-blue/80",
        "pastel-cyan": "border-pastel-cyan bg-pastel-cyan text-foreground hover:bg-pastel-cyan/80 hover:border-pastel-cyan/80",
        "pastel-teal": "border-pastel-teal bg-pastel-teal text-foreground hover:bg-pastel-teal/80 hover:border-pastel-teal/80",
        "pastel-lime": "border-pastel-lime bg-pastel-lime text-foreground hover:bg-pastel-lime/80 hover:border-pastel-lime/80",
        "pastel-yellow": "border-pastel-yellow bg-pastel-yellow text-foreground hover:bg-pastel-yellow/80 hover:border-pastel-yellow/80",
        "pastel-orange": "border-pastel-orange bg-pastel-orange text-foreground hover:bg-pastel-orange/80 hover:border-pastel-orange/80",
        "pastel-red": "border-pastel-red bg-pastel-red text-foreground hover:bg-pastel-red/80 hover:border-pastel-red/80",
        "pastel-pink": "border-pastel-pink bg-pastel-pink text-foreground hover:bg-pastel-pink/80 hover:border-pastel-pink/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
