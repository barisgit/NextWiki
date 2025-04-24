"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import { toast } from "sonner";
import { useTRPC } from "~/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { logger } from "@repo/logger";

interface GroupFormProps {
  group?: {
    id: number;
    name: string;
    description: string | null;
    isSystem?: boolean;
    isEditable?: boolean;
    allowUserAssignment?: boolean;
  };
  permissions: {
    id: number;
    description: string | null;
    moduleId: number;
    resource: string;
    actionId: number;
    module?: { name: string };
    action?: { name: string };
  }[];
  groupPermissions?: number[];
  initialSelectedModuleIds?: number[];
  initialSelectedActionIds?: number[];
  initialSelectedModuleNames?: string[];
  initialSelectedActionNames?: string[];
}

export default function GroupForm({
  group,
  permissions,
  groupPermissions = [],
  initialSelectedModuleIds,
  initialSelectedActionIds,
  initialSelectedModuleNames = [],
  initialSelectedActionNames = [],
}: GroupFormProps) {
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [selectedPermissions, setSelectedPermissions] =
    useState<number[]>(groupPermissions);
  const [selectedModules, setSelectedModules] = useState<number[]>(
    initialSelectedModuleIds ?? []
  );
  const [selectedActions, setSelectedActions] = useState<number[]>(
    initialSelectedActionIds ?? []
  );

  const isSystem = group?.isSystem ?? false;
  // const isEditable = group?.isEditable ?? true;
  // const allowUserAssignment = group?.allowUserAssignment ?? true;

  const trpc = useTRPC();

  // Fetch available modules and actions
  const { data: availableModules = [], isLoading: modulesLoading } = useQuery(
    trpc.admin.permissions.getModules.queryOptions()
  );
  const { data: availableActions = [], isLoading: actionsLoading } = useQuery(
    trpc.admin.permissions.getActions.queryOptions()
  );

  // Effect to initialize selected IDs from names once data is loaded
  useEffect(() => {
    if (
      !modulesLoading &&
      Array.isArray(availableModules) &&
      initialSelectedModuleNames.length > 0 &&
      availableModules.length > 0 &&
      selectedModules.length === 0
    ) {
      const moduleNameToIdMap = new Map(
        availableModules.map((m) => [m.name, m.id])
      );
      const ids = initialSelectedModuleNames
        .map((name) => moduleNameToIdMap.get(name))
        .filter((id): id is number => id !== undefined);
      setSelectedModules(ids);
    }
  }, [
    modulesLoading,
    availableModules,
    initialSelectedModuleNames,
    selectedModules,
  ]);

  useEffect(() => {
    if (
      !actionsLoading &&
      Array.isArray(availableActions) &&
      initialSelectedActionNames.length > 0 &&
      availableActions.length > 0 &&
      selectedActions.length === 0
    ) {
      const actionNameToIdMap = new Map(
        availableActions.map((a) => [a.name, a.id])
      );
      const ids = initialSelectedActionNames
        .map((name) => actionNameToIdMap.get(name))
        .filter((id): id is number => id !== undefined);
      setSelectedActions(ids);
    }
  }, [
    actionsLoading,
    availableActions,
    initialSelectedActionNames,
    selectedActions,
  ]);

  const createGroup = useMutation(
    trpc.admin.groups.create.mutationOptions({
      onSuccess: () => {
        toast.success("Group created successfully");
        router.push("/admin/groups");
      },
      onError: (error: unknown) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred");
        }
      },
    })
  );

  const updateGroup = useMutation(
    trpc.admin.groups.update.mutationOptions({
      onSuccess: () => {
        toast.success("Group updated successfully");
        router.push("/admin/groups");
      },
      onError: (error: unknown) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred");
        }
      },
    })
  );

  const addPermissions = useMutation(
    trpc.admin.groups.addPermissions.mutationOptions({
      onError: (error: unknown) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred");
        }
      },
    })
  );

  const addModulePermissions = useMutation(
    trpc.admin.groups.addModulePermissions.mutationOptions({
      onError: (error: unknown) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred");
        }
      },
    })
  );

  const addActionPermissions = useMutation(
    trpc.admin.groups.addActionPermissions.mutationOptions({
      onError: (error: unknown) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred");
        }
      },
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (group) {
        // Update existing group
        const updatedGroup = await updateGroup.mutateAsync({
          id: group.id,
          name,
          description,
        });

        // Update permissions
        await addPermissions.mutateAsync({
          groupId: updatedGroup.id,
          permissionIds: selectedPermissions,
        });

        // Update module permissions
        await addModulePermissions.mutateAsync({
          groupId: updatedGroup.id,
          moduleIds: selectedModules,
        });

        // Update action permissions
        await addActionPermissions.mutateAsync({
          groupId: updatedGroup.id,
          actionIds: selectedActions,
        });
      } else {
        // Create new group
        const newGroup = await createGroup.mutateAsync({
          name,
          description,
        });

        if (!newGroup) {
          throw new Error("New group is undefined");
        }

        // Add permissions
        await addPermissions.mutateAsync({
          groupId: newGroup.id,
          permissionIds: selectedPermissions,
        });

        // Add module permissions
        await addModulePermissions.mutateAsync({
          groupId: newGroup.id,
          moduleIds: selectedModules,
        });

        // Add action permissions
        await addActionPermissions.mutateAsync({
          groupId: newGroup.id,
          actionIds: selectedActions,
        });
      }
    } catch (error) {
      logger.error("Error saving group:", error);
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce(
    (acc, permission) => {
      if (!permission.module) {
        return acc;
      }
      if (!acc[permission.module.name]) {
        acc[permission.module.name] = [];
      }
      const moduleKey = permission.module.name;
      if (!acc[moduleKey]) {
        acc[moduleKey] = [];
      }
      acc[moduleKey]?.push(permission);
      return acc;
    },
    {} as Record<string, typeof permissions>
  );

  // Check if a permission is allowed based on module and action permissions
  const isPermissionAllowed = (permission: (typeof permissions)[0]) => {
    // If no modules are selected, all modules are allowed
    if (selectedModules.length === 0) {
      // If no actions are selected, all actions are allowed
      if (selectedActions.length === 0) return true;
      // Otherwise, check if the action is allowed
      return selectedActions.includes(permission.actionId);
    }
    // If modules are selected, check if the module is allowed
    if (!selectedModules.includes(permission.moduleId)) return false;
    // If actions are selected, check if the action is allowed
    if (
      selectedActions.length > 0 &&
      !selectedActions.includes(permission.actionId)
    )
      return false;
    return true;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            required
            disabled={isSystem}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            disabled={isSystem}
          />
        </div>
        {isSystem && (
          <div className="dark:bg-warning-800/80 bg-background-level1 border-primary rounded-lg border p-4 text-sm shadow-md">
            <p className="font-medium">This is a system group</p>
            <p>
              You can manage permissions for this group, but the name and
              description cannot be modified.
            </p>
          </div>
        )}
        {name === "Administrators" && (
          <div className="bg-background-level1 border-warning rounded-lg border p-4 text-sm shadow-md">
            <p className="font-medium">Administrator Group</p>
            <p>
              The Administrators group has full access to all system features by
              default. You are viewing this group for reference only.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main permissions area */}
        <div className="col-span-8">
          <div className="bg-background-level1 border-border-default rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Permissions</h2>
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(
                ([module, modulePermissions]) => (
                  <div key={module} className="space-y-2">
                    <h3 className="font-medium">{module}</h3>
                    <div className="grid gap-2">
                      {modulePermissions.map((permission) => {
                        const isAllowed = isPermissionAllowed(permission);
                        const isSelected = selectedPermissions.includes(
                          permission.id
                        );

                        return (
                          <TooltipProvider key={permission.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`permission-${permission.id}`}
                                    checked={isSelected}
                                    disabled={
                                      !isAllowed || name === "Administrators"
                                    }
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                      if (e.target.checked) {
                                        setSelectedPermissions([
                                          ...selectedPermissions,
                                          permission.id,
                                        ]);
                                      } else {
                                        setSelectedPermissions(
                                          selectedPermissions.filter(
                                            (id) => id !== permission.id
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`permission-${permission.id}`}
                                    className={`text-sm ${
                                      !isAllowed ? "text-text-tertiary" : ""
                                    }`}
                                  >
                                    {permission.description}
                                  </label>
                                </div>
                              </TooltipTrigger>
                              {!isAllowed && (
                                <TooltipContent>
                                  <p>
                                    This permission is not available because:
                                    {!selectedModules.includes(
                                      permission.moduleId
                                    ) && (
                                      <span className="block">
                                        • The{" "}
                                        {permission.module?.name ?? "module"}{" "}
                                        module is not selected
                                      </span>
                                    )}
                                    {selectedActions.length > 0 &&
                                      !selectedActions.includes(
                                        permission.actionId
                                      ) && (
                                        <span className="block">
                                          • The{" "}
                                          {permission.action?.name ?? "action"}{" "}
                                          action is not allowed
                                        </span>
                                      )}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Permissions sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Modules */}
          <div className="bg-background-level1 border-border-default rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Module Permissions</h2>
            <p className="text-text-tertiary mb-4 text-sm">
              Select which modules this group can access. If no modules are
              selected, all modules are allowed.
            </p>
            <div className="grid gap-2">
              {Array.isArray(availableModules) &&
                availableModules.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={selectedModules.includes(module.id)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          setSelectedModules([...selectedModules, module.id]);
                        } else {
                          setSelectedModules(
                            selectedModules.filter((id) => id !== module.id)
                          );
                        }
                      }}
                      disabled={name === "Administrators"}
                    />
                    <Label htmlFor={`module-${module.id}`}>{module.name}</Label>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-background-level1 border-border-default rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Action Permissions</h2>
            <p className="text-text-tertiary mb-4 text-sm">
              Select which actions this group can perform. If no actions are
              selected, all actions are allowed.
            </p>
            <div className="grid gap-2">
              {Array.isArray(availableActions) &&
                availableActions.map((action) => (
                  <div key={action.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`action-${action.id}`}
                      checked={selectedActions.includes(action.id)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          setSelectedActions([...selectedActions, action.id]);
                        } else {
                          setSelectedActions(
                            selectedActions.filter((id) => id !== action.id)
                          );
                        }
                      }}
                      disabled={name === "Administrators"}
                    />
                    <Label htmlFor={`action-${action.id}`}>{action.name}</Label>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outlined"
          onClick={() => router.push("/admin/groups")}
        >
          Cancel
        </Button>
        {name !== "Administrators" && (
          <Button type="submit">
            {group ? "Update Group" : "Create Group"}
          </Button>
        )}
      </div>
    </form>
  );
}
