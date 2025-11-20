// components/ui/page-header.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

type PageHeaderSize = "sm" | "md" | "lg" | "xl";

interface PageHeaderProps {
  title: string;
  description?: ReactNode | string;
  badge?: ReactNode | string;
  size?: PageHeaderSize;
  actions?: ReactNode;
  withBorder?: boolean; // control bottom border
  className?: string;
}

const titleSizeClasses: Record<PageHeaderSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function PageHeader({
  title,
  description,
  badge,
  size = "lg",
  actions,
  withBorder = true,
  className,
}: PageHeaderProps) {
  return (
    <Item
      variant="outline"
      className={cn(
        "rounded-none border-x-0 border-t-0 border-b bg-transparent p-0",
        withBorder ? "border-b" : "border-b-0",
        className
      )}
    >
      <ItemContent className="flex-1">
        <div className="flex items-center gap-3">
          <ItemTitle className={cn("font-semibold leading-tight", titleSizeClasses[size])}>
            {title}
          </ItemTitle>
          {badge && (
           badge
          )}
        </div>
        {description && (
          <ItemDescription className="text-sm text-muted-foreground max-w-3xl">
            {description}
          </ItemDescription>
        )}
      </ItemContent>

      {actions && <ItemActions className="flex items-center gap-3">{actions}</ItemActions>}
    </Item>
  );
}