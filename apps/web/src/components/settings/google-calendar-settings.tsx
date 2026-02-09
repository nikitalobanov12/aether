"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Unlink,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";
import { toast } from "~/components/ui/sonner";

export function GoogleCalendarSettings() {
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading: statusLoading } =
    api.googleCalendar.getStatus.useQuery();
  const { data: authUrl } = api.googleCalendar.getAuthUrl.useQuery(undefined, {
    enabled: !status?.connected,
  });
  const { data: calendars } = api.googleCalendar.getCalendarList.useQuery(
    undefined,
    {
      enabled: status?.connected ?? false,
    },
  );
  const { data: taskLists } = api.googleCalendar.getTaskLists.useQuery(
    undefined,
    {
      enabled: status?.connected ?? false,
    },
  );

  const utils = api.useUtils();

  const disconnectMutation = api.googleCalendar.disconnect.useMutation({
    onError: () => {
      toast.error("Failed to disconnect Google account");
    },
    onSuccess: () => {
      toast.success("Google account disconnected");
    },
    onSettled: () => {
      void utils.googleCalendar.getStatus.invalidate();
    },
  });

  const updateSettingsMutation = api.googleCalendar.updateSettings.useMutation({
    onError: () => {
      toast.error("Failed to update settings");
    },
    onSettled: () => {
      void utils.googleCalendar.getStatus.invalidate();
    },
  });

  const handleConnect = () => {
    if (authUrl?.authUrl) {
      setIsConnecting(true);
      window.location.href = authUrl.authUrl;
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Sync your calendar events and tasks with Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Sync your calendar events and tasks with Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Calendar className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 font-medium">Connect Google Calendar</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              View your Google Calendar events alongside your tasks and sync
              completed tasks to Google Tasks.
            </p>
            <Button
              className="mt-4"
              onClick={handleConnect}
              disabled={isConnecting || !authUrl?.authUrl}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Google Account
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Sync your calendar events and tasks with Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Connected</p>
              <p className="text-muted-foreground text-xs">
                {status.connectedAt
                  ? `Connected on ${new Date(status.connectedAt).toLocaleDateString()}`
                  : "Your Google account is connected"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
          >
            {disconnectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect
              </>
            )}
          </Button>
        </div>

        {/* Calendar Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Calendar Events</Label>
              <p className="text-muted-foreground text-xs">
                Display Google Calendar events in your daily planner
              </p>
            </div>
            <Switch
              checked={status.calendarEnabled}
              onCheckedChange={(checked: boolean) =>
                updateSettingsMutation.mutate({ calendarEnabled: checked })
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          {status.calendarEnabled &&
            calendars &&
            calendars.calendars.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="calendarSelect">Calendar</Label>
                <Select
                  value={status.calendarId ?? "primary"}
                  onValueChange={(value) =>
                    updateSettingsMutation.mutate({ calendarId: value })
                  }
                  disabled={updateSettingsMutation.isPending}
                >
                  <SelectTrigger id="calendarSelect">
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        <div className="flex items-center gap-2">
                          {cal.backgroundColor && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cal.backgroundColor }}
                            />
                          )}
                          {cal.name}
                          {cal.primary && (
                            <span className="text-muted-foreground text-xs">
                              (Primary)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
        </div>

        {/* Tasks Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sync Tasks to Google Tasks</Label>
              <p className="text-muted-foreground text-xs">
                Sync completed tasks to your Google Tasks list
              </p>
            </div>
            <Switch
              checked={status.tasksEnabled}
              onCheckedChange={(checked: boolean) =>
                updateSettingsMutation.mutate({ tasksEnabled: checked })
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          {status.tasksEnabled &&
            taskLists &&
            taskLists.taskLists.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="taskListSelect">Task List</Label>
                <Select
                  value={status.tasksListId ?? "@default"}
                  onValueChange={(value) =>
                    updateSettingsMutation.mutate({ tasksListId: value })
                  }
                  disabled={updateSettingsMutation.isPending}
                >
                  <SelectTrigger id="taskListSelect">
                    <SelectValue placeholder="Select a task list" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskLists.taskLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
        </div>

        {/* Sync Status */}
        <div className="rounded-lg border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last calendar sync</span>
            <span>
              {status.lastCalendarSync
                ? new Date(status.lastCalendarSync).toLocaleString()
                : "Never"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted-foreground">Last tasks sync</span>
            <span>
              {status.lastTasksSync
                ? new Date(status.lastTasksSync).toLocaleString()
                : "Never"}
            </span>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            Force Sync (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
