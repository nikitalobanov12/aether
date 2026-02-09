"use client";

import { useState } from "react";
import { Save, Loader2, Sun, Moon, Monitor } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { applyTheme } from "~/components/providers/theme-provider";
import { GoogleCalendarSettings } from "~/components/settings/google-calendar-settings";
import { toast } from "~/components/ui/sonner";

type UserPreferences = NonNullable<RouterOutputs["userPreferences"]["get"]>;

interface SettingsFormProps {
  initialPreferences: UserPreferences;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function SettingsForm({ initialPreferences }: SettingsFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: _currentPrefs } = api.userPreferences.get.useQuery(undefined, {
    initialData: initialPreferences,
  });

  const utils = api.useUtils();

  const updatePreferences = api.userPreferences.update.useMutation({
    onSuccess: (data) => {
      if (data) {
        setPreferences(data);
      }
      setHasChanges(false);
      toast.success("Settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
    onSettled: () => {
      void utils.userPreferences.get.invalidate();
    },
  });

  const updateField = <K extends keyof UserPreferences>(
    field: K,
    value: UserPreferences[K],
  ) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferences.mutate({
      theme: preferences.theme as "light" | "dark" | "system" | undefined,
      language: preferences.language ?? undefined,
      dateFormat: preferences.dateFormat ?? undefined,
      timeFormat: preferences.timeFormat as "12h" | "24h" | undefined,
      weekStartsOn: preferences.weekStartsOn ?? undefined,
      showCompletedTasks: preferences.showCompletedTasks ?? undefined,
      taskSortBy: preferences.taskSortBy ?? undefined,
      taskSortOrder: preferences.taskSortOrder as "asc" | "desc" | undefined,
      calendarDefaultView: preferences.calendarDefaultView ?? undefined,
      autoScheduleEnabled: preferences.autoScheduleEnabled ?? undefined,
      workingHoursStart: preferences.workingHoursStart ?? undefined,
      workingHoursEnd: preferences.workingHoursEnd ?? undefined,
      workingDays: (preferences.workingDays as number[] | null) ?? undefined,
      bufferTimeBetweenTasks: preferences.bufferTimeBetweenTasks ?? undefined,
      maxTaskChunkSize: preferences.maxTaskChunkSize ?? undefined,
      minTaskChunkSize: preferences.minTaskChunkSize ?? undefined,
      schedulingLookaheadDays: preferences.schedulingLookaheadDays ?? undefined,
      maxDailyWorkHours: preferences.maxDailyWorkHours ?? undefined,
      focusTimeMinimumMinutes: preferences.focusTimeMinimumMinutes ?? undefined,
    });
  };

  const workingDays = (preferences.workingDays as number[] | null) ?? [
    1, 2, 3, 4, 5,
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="display" className="space-y-6">
        <TabsList>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how Aether looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  {[
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={
                        preferences.theme === value ? "default" : "outline"
                      }
                      className="flex-1"
                      onClick={() => {
                        updateField("theme", value);
                        applyTheme(value as "light" | "dark" | "system");
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date & Time Format */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={preferences.dateFormat ?? "MM/DD/YYYY"}
                    onValueChange={(v) => updateField("dateFormat", v)}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={preferences.timeFormat ?? "12h"}
                    onValueChange={(v) => updateField("timeFormat", v)}
                  >
                    <SelectTrigger id="timeFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (1:00 PM)</SelectItem>
                      <SelectItem value="24h">24-hour (13:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Week Start */}
              <div className="space-y-2">
                <Label htmlFor="weekStartsOn">Week Starts On</Label>
                <Select
                  value={String(preferences.weekStartsOn ?? 0)}
                  onValueChange={(v) =>
                    updateField("weekStartsOn", parseInt(v))
                  }
                >
                  <SelectTrigger id="weekStartsOn" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Views</CardTitle>
              <CardDescription>
                Set your preferred default views for the calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendarDefaultView">Calendar View</Label>
                <Select
                  value={preferences.calendarDefaultView ?? "3-day"}
                  onValueChange={(v) => updateField("calendarDefaultView", v)}
                >
                  <SelectTrigger id="calendarDefaultView">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="3-day">3 Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskSortBy">Default Task Sort</Label>
                <div className="flex gap-2">
                  <Select
                    value={preferences.taskSortBy ?? "priority"}
                    onValueChange={(v) => updateField("taskSortBy", v)}
                  >
                    <SelectTrigger id="taskSortBy" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={preferences.taskSortOrder ?? "asc"}
                    onValueChange={(v) => updateField("taskSortOrder", v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Settings */}
        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Define your typical working schedule for AI scheduling.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Working Days */}
              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      variant={
                        workingDays.includes(day.value) ? "default" : "outline"
                      }
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const newDays = workingDays.includes(day.value)
                          ? workingDays.filter((d) => d !== day.value)
                          : [...workingDays, day.value].sort((a, b) => a - b);
                        updateField("workingDays", newDays);
                      }}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workingHoursStart">Start Time</Label>
                  <Input
                    id="workingHoursStart"
                    type="time"
                    value={preferences.workingHoursStart ?? "09:00"}
                    onChange={(e) =>
                      updateField("workingHoursStart", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingHoursEnd">End Time</Label>
                  <Input
                    id="workingHoursEnd"
                    type="time"
                    value={preferences.workingHoursEnd ?? "17:00"}
                    onChange={(e) =>
                      updateField("workingHoursEnd", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Max Daily Hours */}
              <div className="space-y-2">
                <Label htmlFor="maxDailyWorkHours">
                  Maximum Daily Work Hours
                </Label>
                <Select
                  value={preferences.maxDailyWorkHours ?? "8.0"}
                  onValueChange={(v) => updateField("maxDailyWorkHours", v)}
                >
                  <SelectTrigger id="maxDailyWorkHours" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                      <SelectItem key={h} value={`${h}.0`}>
                        {h} hours
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Scheduling</CardTitle>
              <CardDescription>
                Configure how tasks are scheduled automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buffer Time */}
              <div className="space-y-2">
                <Label htmlFor="bufferTimeBetweenTasks">
                  Buffer Between Tasks (minutes)
                </Label>
                <Select
                  value={String(preferences.bufferTimeBetweenTasks ?? 15)}
                  onValueChange={(v) =>
                    updateField("bufferTimeBetweenTasks", parseInt(v))
                  }
                >
                  <SelectTrigger
                    id="bufferTimeBetweenTasks"
                    className="w-[200px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m === 0 ? "No buffer" : `${m} minutes`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Time added between scheduled tasks for breaks or transitions.
                </p>
              </div>

              {/* Task Chunk Sizes */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minTaskChunkSize">Minimum Task Block</Label>
                  <Select
                    value={String(preferences.minTaskChunkSize ?? 30)}
                    onValueChange={(v) =>
                      updateField("minTaskChunkSize", parseInt(v))
                    }
                  >
                    <SelectTrigger id="minTaskChunkSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[15, 20, 25, 30, 45, 60].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTaskChunkSize">Maximum Task Block</Label>
                  <Select
                    value={String(preferences.maxTaskChunkSize ?? 120)}
                    onValueChange={(v) =>
                      updateField("maxTaskChunkSize", parseInt(v))
                    }
                  >
                    <SelectTrigger id="maxTaskChunkSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[60, 90, 120, 150, 180, 240].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m >= 60
                            ? `${m / 60}h ${m % 60 ? `${m % 60}m` : ""}`.trim()
                            : `${m}m`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Focus Time */}
              <div className="space-y-2">
                <Label htmlFor="focusTimeMinimumMinutes">
                  Minimum Focus Time Block
                </Label>
                <Select
                  value={String(preferences.focusTimeMinimumMinutes ?? 90)}
                  onValueChange={(v) =>
                    updateField("focusTimeMinimumMinutes", parseInt(v))
                  }
                >
                  <SelectTrigger
                    id="focusTimeMinimumMinutes"
                    className="w-[200px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120, 150, 180].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m >= 60
                          ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim()
                          : `${m} minutes`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  The scheduler will try to protect blocks of this size for deep
                  work.
                </p>
              </div>

              {/* Lookahead Days */}
              <div className="space-y-2">
                <Label htmlFor="schedulingLookaheadDays">
                  Scheduling Lookahead
                </Label>
                <Select
                  value={String(preferences.schedulingLookaheadDays ?? 14)}
                  onValueChange={(v) =>
                    updateField("schedulingLookaheadDays", parseInt(v))
                  }
                >
                  <SelectTrigger
                    id="schedulingLookaheadDays"
                    className="w-[200px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 14, 21, 30, 60, 90].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} days
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  How far ahead the AI will look when scheduling tasks.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <GoogleCalendarSettings />

          <Card>
            <CardHeader>
              <CardTitle>AI Scheduling</CardTitle>
              <CardDescription>
                Powered by Hugging Face inference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Schedule Tasks</p>
                  <p className="text-muted-foreground text-sm">
                    Automatically suggest optimal times for unscheduled tasks.
                  </p>
                </div>
                <Button
                  variant={
                    preferences.autoScheduleEnabled ? "default" : "outline"
                  }
                  onClick={() =>
                    updateField(
                      "autoScheduleEnabled",
                      !preferences.autoScheduleEnabled,
                    )
                  }
                >
                  {preferences.autoScheduleEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updatePreferences.isPending}
          className={cn(
            "shadow-lg transition-all",
            hasChanges ? "opacity-100" : "opacity-0",
          )}
        >
          {updatePreferences.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
