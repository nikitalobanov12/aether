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
  ChevronRight,
  FolderKanban,
  BarChart3,
  Home,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
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
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Today", href: "/today", icon: Sun },
  { name: "This Week", href: "/week", icon: CalendarDays },
  { name: "Insights", href: "/insights", icon: BarChart3 },
];

const secondaryNavigation = [
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {/* Main navigation */}
      <div className="mb-2">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Plan
        </p>
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
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.name}
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
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
              <item.icon className="h-5 w-5 text-muted-foreground" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Goals tree component with collapsible projects
function GoalsTree({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const { data: goals = [] } = api.goal.getAll.useQuery({
    includeCompleted: false,
  });

  const toggleGoal = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  if (goals.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Goals
      </p>
      <div className="space-y-1">
        {goals.slice(0, 5).map((goal) => {
          const isExpanded = expandedGoals.has(goal.id);
          const hasProjects = goal.projects.length > 0;
          const progress = goal.totalTaskCount > 0 
            ? Math.round((goal.completedTaskCount / goal.totalTaskCount) * 100) 
            : 0;

          return (
            <Collapsible
              key={goal.id}
              open={isExpanded}
              onOpenChange={() => toggleGoal(goal.id)}
            >
              <div className="group">
                <div className="flex items-center">
                  {hasProjects ? (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 hover:bg-muted"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  ) : (
                    <div className="w-7" />
                  )}
                  <Link
                    href="/goals"
                    onClick={onItemClick}
                    className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted group-hover:text-foreground"
                  >
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate text-muted-foreground group-hover:text-foreground">{goal.title}</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {progress}%
                    </span>
                  </Link>
                </div>

                {/* Progress bar */}
                <div className="ml-9 mr-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/60 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {hasProjects && (
                  <CollapsibleContent>
                    <div className="ml-7 space-y-0.5 border-l border-border/50 pl-3 mt-1">
                      {goal.projects.map((project) => {
                        const isActive = pathname === `/projects/${project.id}`;
                        const completedCount = project.tasks.filter(
                          (t) => t.status === "completed",
                        ).length;
                        const totalCount = project.tasks.length;

                        return (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            onClick={onItemClick}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                              isActive
                                ? "bg-muted text-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <FolderKanban className="h-3.5 w-3.5" />
                            <span className="truncate">{project.title}</span>
                            <span className="text-muted-foreground ml-auto text-xs">
                              {completedCount}/{totalCount}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          );
        })}
        {goals.length > 5 && (
          <Link
            href="/goals"
            onClick={onItemClick}
            className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all {goals.length} goals...
          </Link>
        )}
      </div>
    </div>
  );
}

function UserMenu({ user }: { user: SidebarProps["user"] }) {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-3 px-3 py-2.5 hover:bg-muted rounded-xl"
        >
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left overflow-hidden">
            <span className="text-sm font-medium truncate w-full">{user.name}</span>
            <span className="text-muted-foreground text-xs truncate w-full">{user.email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
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

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="hidden w-72 flex-col border-r border-border/50 bg-sidebar md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/today" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-primary h-9 w-9 flex items-center justify-center rounded-xl shadow-sm">
              <span className="text-primary-foreground text-lg font-bold font-display">A</span>
            </div>
          </div>
          <span className="font-display text-xl tracking-tight">Aether</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <NavLinks />
      </ScrollArea>

      {/* User menu */}
      <div className="border-t border-border/50 p-4">
        <UserMenu user={user} />
      </div>
    </aside>
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
              <span className="text-primary-foreground text-lg font-bold font-display">A</span>
            </div>
            <span className="font-display text-xl tracking-tight">Aether</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <NavLinks onItemClick={() => setOpen(false)} />
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
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6">
      <div className="flex items-center gap-4">
        <MobileNav user={user} />
        {/* Breadcrumb or page title could go here */}
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications, search, etc. could go here */}
      </div>
    </header>
  );
}
