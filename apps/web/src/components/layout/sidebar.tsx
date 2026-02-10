"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Target,
  Settings,
  LogOut,
  Menu,
  Sun,
  CalendarDays,
  FolderKanban,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

const mainNavigation = [
  { name: "Today", href: "/today", icon: Sun },
  { name: "This Week", href: "/week", icon: CalendarDays },
  { name: "Insights", href: "/insights", icon: BarChart3 },
];

const secondaryNavigation = [
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Collapsed icon-only navigation
function CollapsedNav() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col items-center gap-1 px-2 py-3">
        {/* Main navigation */}
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.name}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Divider */}
        <div className="my-2 w-6 border-t border-border/50" />

        {/* Secondary navigation */}
        {secondaryNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.name}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

// Expanded navigation overlay
function ExpandedNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-2">
      {/* Main navigation */}
      <div className="mb-3">
        <p className="px-3 py-1.5 text-eyebrow text-muted-foreground">Plan</p>
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Goals tree */}
      <GoalsTree onItemClick={onItemClick} />

      {/* Divider */}
      <div className="my-3 border-t border-border/50" />

      {/* Secondary navigation */}
      <div>
        <p className="px-3 py-1.5 text-eyebrow text-muted-foreground">
          Organize
        </p>
        {secondaryNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Goals tree component - simplified for overlay
function GoalsTree({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const { data: goals = [] } = api.goal.getAll.useQuery({
    includeCompleted: false,
  });

  if (goals.length === 0) return null;

  return (
    <div>
      <p className="px-3 py-1.5 text-eyebrow text-muted-foreground">Goals</p>
      <div className="space-y-0.5">
        {goals.slice(0, 4).map((goal) => {
          const progress =
            goal.totalTaskCount > 0
              ? Math.round((goal.completedTaskCount / goal.totalTaskCount) * 100)
              : 0;

          return (
            <div key={goal.id} className="group">
              <Link
                href="/goals"
                onClick={onItemClick}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Target className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-muted-foreground group-hover:text-foreground">
                  {goal.title}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {progress}%
                </span>
              </Link>

              {/* Nested projects - first 2 only */}
              {goal.projects.slice(0, 2).map((project) => {
                const isActive = pathname === `/projects/${project.id}`;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    onClick={onItemClick}
                    className={cn(
                      "ml-6 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <FolderKanban className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{project.title}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
        {goals.length > 4 && (
          <Link
            href="/goals"
            onClick={onItemClick}
            className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all {goals.length} goals →
          </Link>
        )}
      </div>
    </div>
  );
}

// User avatar with dropdown
function UserMenu({ user, collapsed }: { user: SidebarProps["user"]; collapsed?: boolean }) {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  const avatarContent = (
    <Avatar className={cn("border border-border/50", collapsed ? "h-9 w-9" : "h-8 w-8")}>
      <AvatarImage src={user.image ?? undefined} alt={user.name} />
      <AvatarFallback className="bg-primary/10 text-primary text-sm">
        {user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-muted"
          >
            {avatarContent}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted rounded-xl"
          >
            {avatarContent}
            <div className="flex flex-col items-start text-left overflow-hidden">
              <span className="text-sm font-medium truncate w-full">
                {user.name}
              </span>
              <span className="text-muted-foreground text-xs truncate w-full">
                {user.email}
              </span>
            </div>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? "center" : "start"} className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Main sidebar component - icon-only with hover expansion
export function Sidebar({ user }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Collapsed sidebar - always visible */}
      <aside className="hidden md:flex w-16 flex-col border-r border-border/50 bg-sidebar z-30">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-border/50">
          <Link href="/today" className="group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-primary h-9 w-9 flex items-center justify-center rounded-xl shadow-sm">
                <span className="text-primary-foreground text-lg font-bold font-display">
                  A
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <CollapsedNav />
        </ScrollArea>

        {/* User menu */}
        <div className="border-t border-border/50 p-3 flex justify-center">
          <UserMenu user={user} collapsed />
        </div>
      </aside>

      {/* Expanded overlay - appears on hover */}
      <div
        className="hidden md:block fixed left-16 top-0 h-full z-20"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Invisible trigger zone */}
        <div className="absolute left-0 top-0 h-full w-2" />

        {/* Expanded panel */}
        <div
          className={cn(
            "h-full w-64 bg-sidebar border-r border-border/50 shadow-xl transition-all duration-300 ease-out",
            isExpanded
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 pointer-events-none"
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center border-b border-border/50 px-4">
            <span className="font-display text-xl tracking-tight">Aether</span>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 h-[calc(100%-8rem)]">
            <ExpandedNav onItemClick={() => setIsExpanded(false)} />
          </ScrollArea>

          {/* User */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-3 bg-sidebar">
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileNav({ user }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border/50 px-6">
          <Link
            href="/today"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <div className="bg-primary h-9 w-9 flex items-center justify-center rounded-xl">
              <span className="text-primary-foreground text-lg font-bold font-display">
                A
              </span>
            </div>
            <span className="font-display text-xl tracking-tight">Aether</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <ExpandedNav onItemClick={() => setOpen(false)} />
        </ScrollArea>

        {/* User menu */}
        <div className="border-t border-border/50 p-4">
          <UserMenu user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TopBar({ user }: SidebarProps) {
  return (
    <header className="flex h-14 items-center border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6">
      <div className="flex items-center gap-4">
        <MobileNav user={user} />
      </div>
    </header>
  );
}
