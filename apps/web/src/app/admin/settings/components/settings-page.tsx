"use client";

import { useState } from "react";
import { useTRPC } from "~/server/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@repo/ui";
import { CategorySettings } from "./category-settings";
import { Loader2 } from "lucide-react";
import type { SettingCategory } from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "~/components/layout/page-header";

// Array of all setting categories
const CATEGORIES: SettingCategory[] = [
  "general",
  "auth",
  "appearance",
  "editor",
  "search",
  "advanced",
];

// Map of category names to display names
const CATEGORY_NAMES: Record<SettingCategory, string> = {
  general: "General",
  auth: "Authentication",
  appearance: "Appearance",
  editor: "Editor",
  search: "Search",
  advanced: "Advanced",
};

// Map of category names to descriptions
const CATEGORY_DESCRIPTIONS: Record<SettingCategory, string> = {
  general: "Basic wiki settings like site name and description",
  auth: "User authentication and registration settings",
  appearance: "Visual appearance and theme settings",
  editor: "Content editor behavior and defaults",
  search: "Search functionality and performance",
  advanced: "Advanced configuration and storage settings",
};

export function SettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] =
    useState<SettingCategory>("general");
  const { data: allSettings, isLoading: isLoadingAll } = useQuery(
    trpc.admin.settings.getAll.queryOptions()
  );

  const getAllQueryKey = trpc.admin.settings.getAll.queryKey();

  // Initialize settings when first loaded
  const initializeSettings = useMutation(
    trpc.admin.settings.initialize.mutationOptions({
      onSuccess: () => {
        // Refetch settings after initialization
        queryClient.invalidateQueries({ queryKey: getAllQueryKey });
      },
    })
  );

  // Test if we have no settings yet
  const noSettings =
    !isLoadingAll && (!allSettings || Object.keys(allSettings).length === 0);

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Settings"
        description="Manage system settings for your wiki"
        action={
          <Button
            variant="outlined"
            onClick={() => initializeSettings.mutate()}
            disabled={initializeSettings.isPending || !noSettings}
          >
            {initializeSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Initialize Default Settings"
            )}
          </Button>
        }
      />

      {noSettings && (
        <Alert variant="warning">
          <AlertTitle>No settings found</AlertTitle>
          <AlertDescription>
            No settings have been initialized yet. Click the button above to
            create the default settings.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure your wiki system settings</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs
            value={activeCategory}
            onValueChange={(value) =>
              setActiveCategory(value as SettingCategory)
            }
          >
            <TabsList className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6">
              {CATEGORIES.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {CATEGORY_NAMES[category]}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((category) => (
              <TabsContent key={category} value={category} className="pt-2">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">
                    {CATEGORY_NAMES[category]} Settings
                  </h3>
                  <p className="text-muted-foreground">
                    {CATEGORY_DESCRIPTIONS[category]}
                  </p>
                </div>

                <CategorySettings
                  category={category}
                  isLoading={isLoadingAll || noSettings}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
