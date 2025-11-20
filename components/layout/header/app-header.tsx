/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import navConfig from "@/config/nav-config.json";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggleButton } from "./theme-toggle";

// ------------------------
// Find Breadcrumb Trail
// ------------------------
function findBreadcrumbTrail(path: string) {
  const navMain = navConfig.navMain;
  const allMatches: any[] = [];

  for (const main of navMain) {
    if (main.url && path === main.url) {
      allMatches.push({ main });
    } else if (main.items) {
      for (const sub of main.items) {
        if (path === sub.url || path.startsWith(sub.url)) {
          allMatches.push({ main, sub });
        }
      }
    } else if (main.url && path.startsWith(main.url)) {
      allMatches.push({ main });
    }
  }

  const bestMatch = allMatches.sort((a, b) => {
    const lenA = (a.sub?.url || a.main.url || "").length;
    const lenB = (b.sub?.url || b.main.url || "").length;
    return lenB - lenA;
  })[0];

  if (!bestMatch) {
    return [{ title: "Dashboard", url: "/dashboard", clickable: false }];
  }

  const trail = [];
  trail.push({
    title: bestMatch.main.title,
    url: bestMatch.main.url ?? "",
    clickable: !!bestMatch.main.items,
  });

  if (bestMatch.sub) {
    trail.push({
      title: bestMatch.sub.title,
      url: bestMatch.sub.url,
      clickable: false,
    });
  }

  return trail;
}

// ------------------------
// Component
// ------------------------
export default function AppHeader() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];
    return findBreadcrumbTrail(pathname);
  }, [pathname]);

  return (
    <div className="z-10 flex-col sticky top-0 w-full bg-sidebar">
      <header className="flex justify-between h-16 px-2 w-full bg-sidebar shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          {/* ---------------- Breadcrumb ---------------- */}
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={`${crumb.url}-${index}`}>
                  {crumb.clickable ? (
                    <BreadcrumbLink href={crumb.url}>
                      {crumb.title}
                    </BreadcrumbLink>
                  ) : index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href="#"
                      className="pointer-events-none opacity-70"
                    >
                      {crumb.title}
                    </BreadcrumbLink>
                  )}

                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          {/* ---------------------------------------------- */}

        </div>
       <div className="flex items-center gap-4">
         <ThemeToggleButton />
          {/* <NavUser/> */}
       </div>
      </header>

      <Separator />
    </div>
  );
}
