"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Target,
  Settings,
  LogOut,
  Menu,
  Kanban,
  Sun,
  CalendarDays,
  ChevronRight,
  FolderKanban,
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
  { name: "Today", href: "/today", icon: Sun },
  { name: "This Week", href: "/week", icon: CalendarDays },
];

const secondaryNavigation = [
  { name: "Boards", href: "/boards", icon: Kanban },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {/* Main navigation */}
      {mainNavigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}

      {/* Goals tree */}
      <GoalsTree onItemClick={onItemClick} />

      {/* Divider */}
      <div className="my-2 border-t" />

      {/* Secondary navigation */}
      {secondaryNavigation.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
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
    <div className="mt-2 space-y-1">
      <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
        Goals
      </div>
      {goals.slice(0, 5).map((goal) => {
        const isExpanded = expandedGoals.has(goal.id);
        const hasProjects = goal.projects.length > 0;

        return (
          <Collapsible
            key={goal.id}
            open={isExpanded}
            onOpenChange={() => toggleGoal(goal.id)}
          >
            <div className="flex items-center">
              {hasProjects ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                  >
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isExpanded && "rotate-90",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
              ) : (
                <div className="w-6" />
              )}
              <Link
                href="/goals"
                onClick={onItemClick}
                className={cn(
                  "text-muted-foreground hover:bg-muted hover:text-foreground flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                )}
              >
                <Target className="h-4 w-4" />
                <span className="truncate">{goal.title}</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {goal.completedTaskCount}/{goal.totalTaskCount}
                </span>
              </Link>
            </div>

            {hasProjects && (
              <CollapsibleContent>
                <div className="ml-6 space-y-0.5 border-l pl-2">
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
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
          </Collapsible>
        );
      })}
      {goals.length > 5 && (
        <Link
          href="/goals"
          onClick={onItemClick}
          className="text-muted-foreground hover:text-foreground block px-3 py-1 text-xs"
        >
          View all {goals.length} goals...
        </Link>
      )}
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
          className="h-auto w-full justify-start gap-3 px-3 py-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
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
    <aside className="bg-background hidden w-64 flex-col border-r md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/today" className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-lg font-bold">A</span>
          </div>
          <span className="text-xl font-bold">Aether</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <NavLinks />
      </ScrollArea>

      {/* User menu */}
      <div className="border-t p-3">
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
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/today"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-lg font-bold">
                A
              </span>
            </div>
            <span className="text-xl font-bold">Aether</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <NavLinks onItemClick={() => setOpen(false)} />
        </ScrollArea>

        {/* User menu */}
        <div className="border-t p-3">
          <UserMenu user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TopBar({ user }: SidebarProps) {
  return (
    <header className="bg-background flex h-16 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-4">
        <MobileNav user={user} />
        {/* Page title could go here */}
      </div>
      <div className="flex items-center gap-4">
        {/* Add notifications, quick actions, etc. here */}
      </div>
    </header>
  );
}
