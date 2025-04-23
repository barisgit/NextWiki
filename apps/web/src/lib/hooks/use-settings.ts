import { useTRPC } from "~/server/client";
import type { SettingCategory, SettingKey, SettingValue } from "@repo/types";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook for accessing a single application setting
 * @param key The setting key to retrieve
 * @param options.fallback Optional fallback value if setting can't be loaded
 * @returns The setting value, loading state, and error state
 */
export function useSetting<K extends SettingKey>(
  key: K,
  options: {
    fallback?: SettingValue<K>;
  } = {}
) {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.admin.settings.get.queryOptions(
      { key },
      {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      }
    )
  );

  // Get either the loaded value, fallback, or null
  const value = data
    ? data.value
    : options.fallback !== undefined
      ? options.fallback
      : null;

  return {
    value: value as SettingValue<K> | null,
    isLoading,
    error,
  };
}

/**
 * Hook for accessing multiple application settings
 * @param keys Array of setting keys to retrieve
 * @returns Object with all settings, loading state, and a method to refetch
 */
export function useSettings<K extends SettingKey>(keys: K[]) {
  const trpc = useTRPC();
  const {
    data: allSettings,
    isLoading,
    refetch,
  } = useQuery(
    trpc.admin.settings.getAll.queryOptions(undefined, {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    })
  );

  // Extract requested settings
  const settings =
    !isLoading && allSettings
      ? keys.reduce(
          (acc, key) => {
            acc[key] = allSettings[key] as SettingValue<K>;
            return acc;
          },
          {} as Record<K, SettingValue<K>>
        )
      : null;

  return {
    settings,
    isLoading,
    refetch,
  };
}

/**
 * Hook for getting settings within a specific category
 * @param category The settings category to retrieve
 * @returns Array of settings in the category, loading state, and error state
 */
export function useSettingsByCategory(category: string) {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.admin.settings.getByCategory.queryOptions(
      { category: category as SettingCategory },
      {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      }
    )
  );

  return {
    settings: data || [],
    isLoading,
    error,
  };
}
