"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import clsx from "clsx";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isOpen?: boolean;
    items?: {
      title: string;
      url?: string;
      icon?: LucideIcon;
      items?: { title: string; url?: string; icon?: LucideIcon }[];
    }[];
  }[];
}) {
  const pathname = usePathname();

  const isActive = (url?: string) => pathname === url;

  const hasActiveSub = (
    subItems?: {
      title: string;
      url?: string;
      icon?: LucideIcon;
      items?: { title: string; url?: string; icon?: LucideIcon }[];
    }[]
  ): boolean =>
    subItems?.some((sub) => isActive(sub.url) || hasActiveSub(sub.items)) ?? false;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isOpen || hasActiveSub(item.items)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={clsx(
                      "relative flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
                      "hover:bg-accent/50",
                      hasActiveSub(item.items) && [
                        "bg-accent",
                        "text-primary",
                        "font-medium",
                        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                        "before:h-5 before:w-[3px] before:rounded-r-full",
                        "before:bg-primary",
                        "hover:bg-accent/80"
                      ]
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) =>
                      subItem.items && subItem.items.length > 0 ? (
                        <Collapsible
                          key={subItem.title}
                          asChild
                          defaultOpen={hasActiveSub(subItem.items)}
                          className="group/collapsible"
                        >
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton
                                className={clsx(
                                  "relative flex items-center gap-2 text-sm font-normal px-3 py-1 rounded-md transition-all duration-200",
                                  "hover:bg-accent/50",
                                  hasActiveSub(subItem.items) && [
                                    "bg-accent",
                                    "text-primary",
                                    "font-medium"
                                  ]
                                )}
                              >
                                {subItem.icon && (
                                  <subItem.icon className="h-4 w-4 opacity-80" />
                                )}
                                <span>{subItem.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {subItem.items.map((subSub) => (
                                  <SidebarMenuSubItem key={subSub.title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      className={clsx(
                                        "relative flex items-center gap-2 text-sm font-normal px-3 py-1 rounded-md transition-all duration-200",
                                        "hover:bg-accent/50",
                                        isActive(subSub.url) && [
                                          "bg-accent",
                                          "text-primary",
                                          "font-medium"
                                        ]
                                      )}
                                    >
                                      <a href={subSub.url}>
                                        {subSub.icon && (
                                          <subSub.icon className="h-4 w-4 opacity-80" />
                                        )}
                                        <span>{subSub.title}</span>
                                      </a>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={clsx(
                              "relative flex items-center gap-2 text-sm font-normal px-3 py-1 rounded-md transition-all duration-200",
                              "hover:bg-accent/50",
                              isActive(subItem.url) && [
                                "bg-accent",
                                "text-primary",
                                "font-medium"
                              ]
                            )}
                          >
                            <a href={subItem.url}>
                              {subItem.icon && (
                                <subItem.icon className="h-4 w-4 opacity-80" />
                              )}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={clsx(
                  "relative flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
                  "hover:bg-accent/50",
                  isActive(item.url) && [
                    "bg-accent",
                    "text-primary",
                    "font-medium",
                    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                    "before:h-5 before:w-[3px] before:rounded-r-full",
                    "before:bg-primary",
                    "hover:bg-accent/80"
                  ]
                )}
              >
                <a href={item.url}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}