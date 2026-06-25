"use client";

import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Search, ClipboardList, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import AuthPromptPopoverContent from "./AuthPromptPopoverContent";
import { DashboardContext } from "@/context/parent-dashboard/DashboardContext";
import { kidNavItems, type NavItemConfig } from "@/config/navigation/kid-nav";
import { parentNavItems } from "@/config/navigation/parent-nav";
import { teacherNavItems } from "@/config/navigation/teacher-nav";
import { getKidPendingAssignmentsCount } from "@/lib/services/kid/classroom.actions";

interface SidebarNavigationProps {
  isOpen: boolean;
  isUserLoggedIn: boolean;
  userRole: string;
  pathname: string;
  isMobile: boolean;
  toggleSidebar: () => void;
  onNewChat: (e?: React.MouseEvent) => void;
  onSearchOpen: (open: boolean) => void;
}

export default function SidebarNavigation({
  isOpen,
  isUserLoggedIn,
  userRole,
  pathname,
  isMobile,
  toggleSidebar,
  onNewChat,
  onSearchOpen,
}: SidebarNavigationProps) {
  const parentContext = useContext(DashboardContext);
  const activeChildId = parentContext?.activeChildId || "";

  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (userRole === "kid" && isMobile) {
      getKidPendingAssignmentsCount()
        .then(setDueCount)
        .catch((err) => console.error("Error fetching assignments count:", err));
    }
  }, [pathname, userRole, isMobile]);

  const mergedNavItems =
    userRole === "kid"
      ? kidNavItems
      : userRole === "parent"
        ? parentNavItems
        : userRole === "teacher"
          ? teacherNavItems
          : [];

  const isLinkActive = (item: NavItemConfig) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const getNavItemHref = (item: NavItemConfig) => {
    if (item.isParameterized && activeChildId) {
      return `${item.href}?childId=${activeChildId}`;
    }
    return item.href;
  };

  const navItems: {
    label: string;
    icon: LucideIcon;
    onClick?: (e?: React.MouseEvent) => void;
    href?: string;
  }[] = [
    { label: "New Chat", icon: PlusCircle, onClick: onNewChat },
    { label: "Search Chats", icon: Search },
    ...(userRole === "kid"
      ? [{ label: "Activities", icon: ClipboardList, href: "/activities" }]
      : []),
  ];

  return isOpen ? (
    // --- OPEN SIDEBAR STATE ---
    <div className="space-y-2 shrink-0 px-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : item.href ? pathname.startsWith(item.href) : false;
        const showActiveStyle = item.label !== "New Chat" && isActive;

        const isSearch = item.label === "Search Chats";
        const isActivities = item.label === "Activities";

        const buttonClass = cn(
          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors group/nav cursor-pointer",
          showActiveStyle ? "bg-sidebar-accent text-sky-500 font-bold" : "text-sidebar-foreground"
        );

        const itemContent = (
          <>
            <Icon className="w-5 h-5 shrink-0 text-slate-500 group-hover/nav:text-slate-700 dark:text-slate-400 dark:group-hover/nav:text-slate-200 transition-colors" />
            <span className="whitespace-nowrap truncate">{item.label}</span>
          </>
        );

        if (isActivities && !isUserLoggedIn) {
          return (
            <Popover key={item.label}>
              <PopoverTrigger className={buttonClass} suppressHydrationWarning={true}>
                {itemContent}
              </PopoverTrigger>
              <PopoverContent
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "center" : "start"}
                sideOffset={isMobile ? 8 : 15}
                className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
              >
                <AuthPromptPopoverContent
                  title="Interactive Activities"
                  description="Sign in or sign up to play custom games, complete quiz challenges, and practice vocabulary!"
                  icon={ClipboardList}
                />
              </PopoverContent>
            </Popover>
          );
        }

        if (isSearch) {
          if (!isUserLoggedIn) {
            return (
              <Popover key={item.label}>
                <PopoverTrigger className={buttonClass} suppressHydrationWarning={true}>
                  {itemContent}
                </PopoverTrigger>
                <PopoverContent
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "center" : "start"}
                  sideOffset={isMobile ? 8 : 15}
                  className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                >
                  <AuthPromptPopoverContent
                    title="Search Chats"
                    description="Sign in or sign up to search your chat history and pick up right where you left off!"
                    icon={Search}
                  />
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => {
                if (isMobile && isOpen) {
                  toggleSidebar();
                }
                onSearchOpen(true);
              }}
              suppressHydrationWarning={true}
              className={buttonClass}
            >
              {itemContent}
            </button>
          );
        }

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (isMobile && isOpen) {
                  toggleSidebar();
                }
                if (item.onClick) {
                  item.onClick(e);
                }
              }}
              prefetch={false}
              className={buttonClass}
            >
              {itemContent}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            onClick={item.onClick}
            suppressHydrationWarning={true}
            className={buttonClass}
          >
            {itemContent}
          </button>
        );
      })}

      {/* Merged Navigation Items (Mobile Only) */}
      {isMobile && mergedNavItems.length > 0 && (
        <>
          <div className="h-px bg-slate-200 dark:bg-slate-800/80 my-3 mx-1 shrink-0" />
          <div className="space-y-2">
            {mergedNavItems.map((item) => {
              const Icon = item.icon;
              const href = getNavItemHref(item);
              const isActive = isLinkActive(item);
              const isClassrooms = item.label === "Classrooms";

              const buttonClass = cn(
                "w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors group/nav cursor-pointer",
                isActive ? "bg-sidebar-accent text-sky-500 font-bold" : "text-sidebar-foreground"
              );

              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => {
                    if (isMobile && isOpen) {
                      toggleSidebar();
                    }
                  }}
                  prefetch={false}
                  className={buttonClass}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Icon className="w-5 h-5 shrink-0 text-slate-500 group-hover/nav:text-slate-700 dark:text-slate-400 dark:group-hover/nav:text-slate-200 transition-colors" />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  {isClassrooms && dueCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-950 shrink-0">
                      {dueCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  ) : (
    // --- CLOSED SIDEBAR STATE ---
    <div className="space-y-3 shrink-0 px-0 flex flex-col items-center justify-center w-full">
      <SidebarMenu className="w-full flex flex-col items-center gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href
                ? pathname.startsWith(item.href)
                : false;
          const showActiveStyle = item.label !== "New Chat" && isActive;

          const isSearch = item.label === "Search Chats";
          const isActivities = item.label === "Activities";

          const collapsedButtonEl = (
            <SidebarMenuButton
              isActive={showActiveStyle}
              tooltip={item.label}
              className={cn(
                "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                showActiveStyle
                  ? "bg-sidebar-accent text-sky-500 font-bold"
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
            </SidebarMenuButton>
          );

          if (isActivities && !isUserLoggedIn) {
            return (
              <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                <Popover>
                  <PopoverTrigger render={collapsedButtonEl} />
                  <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={15}
                    className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                  >
                    <AuthPromptPopoverContent
                      title="Interactive Activities"
                      description="Sign in or sign up to play custom games, complete quiz challenges, and practice vocabulary!"
                      icon={ClipboardList}
                    />
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            );
          }

          if (isSearch) {
            if (!isUserLoggedIn) {
              return (
                <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                  <Popover>
                    <PopoverTrigger render={collapsedButtonEl} />
                    <PopoverContent
                      side="right"
                      align="start"
                      sideOffset={15}
                      className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                    >
                      <AuthPromptPopoverContent
                        title="Search Chats"
                        description="Sign in or sign up to search your chat history and pick up right where you left off!"
                        icon={Search}
                      />
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                <SidebarMenuButton
                  onClick={() => onSearchOpen(true)}
                  tooltip={item.label}
                  className={cn(
                    "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    showActiveStyle
                      ? "bg-sidebar-accent text-sky-500 font-bold"
                      : "text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          if (item.href) {
            return (
              <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                <SidebarMenuButton
                  isActive={showActiveStyle}
                  tooltip={item.label}
                  render={<Link href={item.href} onClick={item.onClick} prefetch={false} />}
                  className={cn(
                    "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    showActiveStyle
                      ? "bg-sidebar-accent text-sky-500 font-bold"
                      : "text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={item.label} className="w-full flex justify-center">
              <SidebarMenuButton
                onClick={item.onClick}
                tooltip={item.label}
                className={cn(
                  "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  showActiveStyle
                    ? "bg-sidebar-accent text-sky-500 font-bold"
                    : "text-sidebar-foreground"
                )}
              >
                <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}
