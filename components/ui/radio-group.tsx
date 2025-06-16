"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// 가로 탭 형태의 라디오 그룹 컴포넌트 추가
const RadioGroupTabs = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn("flex w-full rounded-md border overflow-hidden", className)}
      {...props}
    />
  )
})
RadioGroupTabs.displayName = "RadioGroupTabs"

// 가로 탭 형태의 라디오 아이템 컴포넌트 추가
const RadioGroupTabsItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    label: React.ReactNode
  }
>(({ className, label, ...props }, ref) => {
  return (
    <div className="flex-1 relative">
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn("peer absolute inset-0 opacity-0 cursor-pointer", className)}
        {...props}
      />
      <div className="flex items-center justify-center p-3 text-center border-r border-gray-300 last:border-r-0 peer-data-[state=checked]:bg-blue-500 peer-data-[state=checked]:text-white transition-colors h-full">
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  )
})
RadioGroupTabsItem.displayName = "RadioGroupTabsItem"

export { RadioGroup, RadioGroupItem, RadioGroupTabs, RadioGroupTabsItem }
