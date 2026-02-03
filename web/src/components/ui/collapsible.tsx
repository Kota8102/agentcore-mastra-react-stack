"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = ({
	className,
	...props
}: ComponentProps<typeof CollapsiblePrimitive.Trigger>) => (
	<CollapsiblePrimitive.Trigger
		className={cn("cursor-pointer", className)}
		{...props}
	/>
);

const CollapsibleContent = ({
	className,
	...props
}: ComponentProps<typeof CollapsiblePrimitive.Content>) => (
	<CollapsiblePrimitive.Content
		className={cn(
			"overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
			className,
		)}
		{...props}
	/>
);

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
