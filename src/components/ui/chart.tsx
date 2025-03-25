import {
    Card as ShadCard,
    CardContent as ShadCardContent,
    CardHeader as ShadCardHeader,
    CardFooter as ShadCardFooter,
    CardTitle as ShadCardTitle,
    CardDescription as ShadCardDescription,
  } from "@/components/ui/card"
  import { forwardRef } from "react"
  import type * as React from "react"
  import { cn } from "@/lib/utils"
  
  const Card = forwardRef<React.ElementRef<typeof ShadCard>, React.ComponentPropsWithoutRef<typeof ShadCard>>(
    ({ className, ...props }, ref) => <ShadCard {...props} ref={ref} className={cn("border shadow-sm", className)} />,
  )
  Card.displayName = ShadCard.displayName
  
  const CardHeader = forwardRef<
    React.ElementRef<typeof ShadCardHeader>,
    React.ComponentPropsWithoutRef<typeof ShadCardHeader>
  >(({ className, ...props }, ref) => (
    <ShadCardHeader {...props} ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} />
  ))
  CardHeader.displayName = ShadCardHeader.displayName
  
  const CardTitle = forwardRef<
    React.ElementRef<typeof ShadCardTitle>,
    React.ComponentPropsWithoutRef<typeof ShadCardTitle>
  >(({ className, ...props }, ref) => (
    <ShadCardTitle {...props} ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} />
  ))
  CardTitle.displayName = ShadCardTitle.displayName
  
  const CardDescription = forwardRef<
    React.ElementRef<typeof ShadCardDescription>,
    React.ComponentPropsWithoutRef<typeof ShadCardDescription>
  >(({ className, ...props }, ref) => (
    <ShadCardDescription {...props} ref={ref} className={cn("text-sm text-muted-foreground", className)} />
  ))
  CardDescription.displayName = ShadCardDescription.displayName
  
  const CardContent = forwardRef<
    React.ElementRef<typeof ShadCardContent>,
    React.ComponentPropsWithoutRef<typeof ShadCardContent>
  >(({ className, ...props }, ref) => <ShadCardContent className={cn("p-6 pt-0", className)} {...props} ref={ref} />)
  CardContent.displayName = ShadCardContent.displayName
  
  const CardFooter = forwardRef<
    React.ElementRef<typeof ShadCardFooter>,
    React.ComponentPropsWithoutRef<typeof ShadCardFooter>
  >(({ className, ...props }, ref) => (
    <ShadCardFooter {...props} ref={ref} className={cn("flex items-center p-6 pt-0", className)} />
  ))
  CardFooter.displayName = ShadCardFooter.displayName
  
  export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
  
  