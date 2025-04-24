"use client";

import { useState } from "react";
import { useTRPC } from "~/server/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Badge,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui";
import { format } from "date-fns";
import type { SettingCategory } from "@repo/types";
import {
  Clock,
  History,
  HelpCircle,
  RotateCw,
  Save,
  EyeOff,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "@repo/logger";

interface CategorySettingsProps {
  category: SettingCategory;
  isLoading: boolean;
}

export function CategorySettings({
  category,
  isLoading,
}: CategorySettingsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: settings, isLoading: isLoadingSettings } = useQuery(
    trpc.admin.settings.getByCategory.queryOptions(
      { category },
      { enabled: !isLoading }
    )
  );

  // State for edited values
  const [editedValues, setEditedValues] = useState<
    Record<string, string | number | boolean | object>
  >({});
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const byCategoryQueryKey = trpc.admin.settings.getByCategory.queryKey();
  const getAllQueryKey = trpc.admin.settings.getAll.queryKey();

  // Update setting mutation
  const updateSetting = useMutation(
    trpc.admin.settings.update.mutationOptions({
      onSuccess: () => {
        // Clear the edited value and refetch
        setEditedValues((prev) => {
          const updated = { ...prev };
          delete updated[updateSetting.variables?.key ?? ""];
          return updated;
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: byCategoryQueryKey });
        queryClient.invalidateQueries({ queryKey: getAllQueryKey });
      },
    })
  );

  // Reset setting mutation
  const resetSetting = useMutation(
    trpc.admin.settings.reset.mutationOptions({
      onSuccess: () => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: byCategoryQueryKey });
        queryClient.invalidateQueries({ queryKey: getAllQueryKey });
      },
    })
  );

  // Get setting history
  const { data: history, isLoading: isLoadingHistory } = useQuery(
    trpc.admin.settings.getHistory.queryOptions(
      { key: historyKey! },
      { enabled: !!historyKey }
    )
  );

  const handleValueChange = (
    key: string,
    value: string | number | boolean | object
  ) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (key: string) => {
    const value = editedValues[key];
    updateSetting.mutate({
      key,
      value,
      reason: `Updated from admin settings page`,
    });
  };

  const handleReset = (key: string) => {
    resetSetting.mutate({
      key,
      reason: `Reset to default from admin settings page`,
    });
  };

  const renderSettingInput = (setting: any) => {
    const key = setting.key;
    const value = key in editedValues ? editedValues[key] : setting.value;
    const type = setting.meta.type;
    // const isEdited = key in editedValues;
    const isSecret = setting.meta.isSecret;

    switch (type) {
      case "string":
        return (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              type={isSecret ? "password" : "text"}
              onChange={(e) => handleValueChange(key, e.target.value)}
              className="max-w-sm"
            />
            {isSecret && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a sensitive setting</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );

      case "number":
        return (
          <Input
            value={value}
            type="number"
            onChange={(e) => handleValueChange(key, Number(e.target.value))}
            className="max-w-xs"
          />
        );

      case "boolean":
        return (
          <Checkbox
            checked={value}
            onChange={(e) => handleValueChange(key, e.target.checked)}
          />
        );

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(value) => handleValueChange(key, value)}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent className="bg-background-level1">
              {setting.meta.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "json":
        // Display JSON as a string in a textarea
        return (
          <div className="max-w-lg">
            <textarea
              value={JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleValueChange(key, parsed);
                } catch (error) {
                  if (error instanceof Error) {
                    logger.error(error.message);
                  } else {
                    logger.error(error as string);
                  }
                }
              }}
              className="border-input bg-background-paper min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        );

      default:
        return <div>Unsupported type: {type}</div>;
    }
  };

  if (isLoading || isLoadingSettings) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-60" />
          </div>
        ))}
      </div>
    );
  }

  if (!settings || settings.length === 0) {
    return <p>No settings found for this category.</p>;
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Setting</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.map((setting) => {
            const key = setting.key;
            const isEdited = key in editedValues;
            const isUpdating =
              updateSetting.isPending && updateSetting.variables?.key === key;
            const isResetting =
              resetSetting.isPending && resetSetting.variables?.key === key;
            const requiresRestart = setting.meta.requiresRestart;

            return (
              <TableRow key={key}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      {key}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                            >
                              <HelpCircle className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{setting.meta.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {requiresRestart && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Requires restart
                        </Badge>
                      )}
                    </div>
                    <div className="text-text-secondary text-xs">
                      {setting.meta.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {renderSettingInput(setting)}
                  {isEdited && (
                    <p className="text-text-secondary mt-1 text-xs">
                      Modified - Save to apply changes
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => handleSave(key)}
                      disabled={!isEdited || isUpdating || isResetting}
                      className="h-8"
                    >
                      {isUpdating ? (
                        <>
                          <Skeleton className="mr-2 h-4 w-4 animate-spin rounded-full" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-1 h-3.5 w-3.5" />
                          Save
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => handleReset(key)}
                      disabled={isUpdating || isResetting}
                      className="h-8"
                    >
                      {isResetting ? (
                        <>
                          <Skeleton className="mr-2 h-4 w-4 animate-spin rounded-full" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <RotateCw className="mr-1 h-3.5 w-3.5" />
                          Reset
                        </>
                      )}
                    </Button>

                    <Dialog
                      open={historyKey === key}
                      onOpenChange={(open) => !open && setHistoryKey(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setHistoryKey(key)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Setting History</DialogTitle>
                          <DialogDescription>
                            History of changes for setting: {key}
                          </DialogDescription>
                        </DialogHeader>

                        {isLoadingHistory ? (
                          <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        ) : history && history.length > 0 ? (
                          <div className="max-h-[400px] overflow-y-auto">
                            {history.map((entry) => (
                              <div
                                key={entry.id}
                                className="space-y-1 border-b py-3 last:border-b-0"
                              >
                                <div className="flex justify-between">
                                  <div className="flex items-center gap-1 font-medium">
                                    <Clock className="text-text-secondary h-4 w-4" />
                                    <span>
                                      {format(
                                        new Date(entry.changedAt),
                                        "MMM d, yyyy h:mm a"
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    {entry.changedById ? (
                                      <span className="text-text-secondary text-sm">
                                        User ID: {entry.changedById}
                                      </span>
                                    ) : (
                                      <span className="text-text-secondary text-sm">
                                        System
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {entry.changeReason && (
                                  <div className="text-sm">
                                    Reason: {entry.changeReason}
                                  </div>
                                )}

                                <div className="mt-1 text-sm font-medium">
                                  Previous value:
                                </div>
                                <div className="bg-background-paper overflow-auto rounded-md p-2 text-sm">
                                  {typeof entry.previousValue === "object"
                                    ? JSON.stringify(
                                        entry.previousValue,
                                        null,
                                        2
                                      )
                                    : String(entry.previousValue)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground py-4 text-center">
                            No history available for this setting
                          </p>
                        )}

                        <DialogFooter>
                          <Button
                            variant="outlined"
                            onClick={() => setHistoryKey(null)}
                          >
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
