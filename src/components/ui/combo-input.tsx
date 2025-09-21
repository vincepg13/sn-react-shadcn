import * as React from 'react'

import { cn } from '@kit/lib/utils'
import { VariantProps, cva } from 'class-variance-authority'

export const inputVariants = cva(
  'flex items-center h-9 w-full px-3 py-1 text-sm bg-transparent file:border-0 file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border border-transparent focus-within:outline-none aria-invalid:ring-1 aria-invalid:ring-destructive aria-invalid:focus-within:ring-2 aria-invalid:focus-within:ring-destructive',

  {
    variants: {
      rounded: {
        none: 'rounded-none',
        md: 'rounded-md',
      },
      variant: {
        outline:
          'border-borde focus-within:border-primary focus-within:shadow-[0_0px_0px_1px_hsl(var(--primary))] aria-invalid:border-transparent',
        filled: 'border-2 bg-background focus-within:border-primary focus-within:bg-transparent',
        underlined:
          'rounded-none border-b-border focus-within:border-b-primary focus-within:shadow-[0_1px_0px_0px_hsl(var(--primary))]',
        unstyled: '',
      },
    },
    defaultVariants: {
      rounded: 'md',
      variant: 'outline',
    },
  }
)

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  innerClass?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, innerClass, rounded, variant, startContent, endContent, ...props }, ref) => {
    return (
      <div className={cn(inputVariants({ variant, rounded, className }), className)}>
        {startContent && (
          <span className="pointer-events-none flex items-center text-muted-foreground">{startContent}</span>
        )}
        <input
          ref={ref}
          {...props}
          className={cn(
            'w-full bg-transparent outline-none focus-visible:outline-none',
            props.disabled && 'opacity-50 cursor-not-allowed',
            {
              'pl-2': !!startContent,
              'pr-2': !!endContent,
            },
            innerClass
          )}
        />
        {endContent && (
          <span className="pointer-events-none flex items-center text-muted-foreground">{endContent}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input as ComboInput }
