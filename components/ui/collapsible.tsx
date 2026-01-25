"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const CollapsibleContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({
    open: false,
    onOpenChange: () => { },
})

const Collapsible = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        open?: boolean
        onOpenChange?: (open: boolean) => void
        defaultOpen?: boolean
    }
>(({ open: controlledOpen, onOpenChange: controlledOnOpenChange, defaultOpen = false, className, children, ...props }, ref) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setUncontrolledOpen

    return (
        <CollapsibleContext.Provider value={{ open: !!open, onOpenChange: onOpenChange || (() => { }) }}>
            <div
                ref={ref}
                className={cn("", className)}
                {...props}
            >
                {children}
            </div>
        </CollapsibleContext.Provider>
    )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, onClick, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(CollapsibleContext)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) onClick(e)
        onOpenChange(!open)
    }

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            ref,
            ...props,
            onClick: handleClick,
            "data-state": open ? "open" : "closed",
        })
    }

    return (
        <button
            ref={ref}
            onClick={handleClick}
            className={cn("", className)}
            data-state={open ? "open" : "closed"}
            {...props}
        >
            {children}
        </button>
    )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open } = React.useContext(CollapsibleContext)

    if (!open) return null

    return (
        <div
            ref={ref}
            className={cn("animate-in fade-in slide-in-from-top-1", className)}
            {...props}
        >
            {children}
        </div>
    )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
