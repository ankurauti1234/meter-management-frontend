import React from "react";
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  color?: string;
  bgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  description,
  color,bgColor
}) => {
  return (
    <Item
      variant="outline"
      className="hover:shadow-md transition-all duration-200 bg-card grid grid-cols-5 divide-x p-0 gap-0 overflow-hidden"
    >
      <ItemContent className="col-span-4 p-2 ">
        <ItemTitle className="text-sm text-muted-foreground">{title}</ItemTitle>
        <ItemDescription className="text-2xl font-semibold text-foreground font-mono leading-tight">
          {value}
        </ItemDescription>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </ItemContent>

      <ItemMedia className={`col-span-1 w-full h-full p-0 flex items-center justify-center -mt-0.5 ${bgColor}`}>
        <Icon className={`${color} size-6 `} />
      </ItemMedia>
    </Item>
  );
};
