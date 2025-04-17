"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTRPC } from "~/lib/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";

interface GroupFormProps {
  group?: {
    id: number;
    name: string;
    description: string | null;
    isLocked?: boolean;
  };
  permissions: {
    id: number;
    name: string;
    description: string | null;
    module: string;
    resource: string;
    action: string;
  }[];
  groupPermissions?: number[];
  groupModulePermissions?: string[];
  groupActionPermissions?: string[];
}

export default function GroupForm({
  group,
  permissions,
  groupPermissions = [],
  groupModulePermissions = [],
  groupActionPermissions = [],
}: GroupFormProps) {
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [selectedPermissions, setSelectedPermissions] =
    useState<number[]>(groupPermissions);
  const [selectedModules, setSelectedModules] = useState<string[]>(
    groupModulePermissions
  );
  const [selectedActions, setSelectedActions] = useState<string[]>(
    groupActionPermissions
  );

  const isLocked = group?.isLocked ?? false;
  const trpc = useTRPC();

  // Fetch available modules and actions
  const { data: availableModules = [] } = useQuery(
    trpc.permissions.getModules.queryOptions()
  );
  const { data: availableActions = [] } = useQuery(
    trpc.permissions.getActions.queryOptions()
  );

  const createGroup = useMutation(
    trpc.groups.create.mutationOptions({
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
    trpc.groups.update.mutationOptions({
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
    trpc.groups.addPermissions.mutationOptions({
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
    trpc.groups.addModulePermissions.mutationOptions({
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
    trpc.groups.addActionPermissions.mutationOptions({
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
          permissions: selectedModules.map((module) => ({
            module,
            isAllowed: true,
          })),
        });

        // Update action permissions
        await addActionPermissions.mutateAsync({
          groupId: updatedGroup.id,
          permissions: selectedActions.map((action) => ({
            action,
            isAllowed: true,
          })),
        });
      } else {
        // Create new group
        const newGroup = await createGroup.mutateAsync({
          name,
          description,
        });

        // Add permissions
        await addPermissions.mutateAsync({
          groupId: newGroup.id,
          permissionIds: selectedPermissions,
        });

        // Add module permissions
        await addModulePermissions.mutateAsync({
          groupId: newGroup.id,
          permissions: selectedModules.map((module) => ({
            module,
            isAllowed: true,
          })),
        });

        // Add action permissions
        await addActionPermissions.mutateAsync({
          groupId: newGroup.id,
          permissions: selectedActions.map((action) => ({
            action,
            isAllowed: true,
          })),
        });
      }
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);

  // Check if a permission is allowed based on module and action permissions
  const isPermissionAllowed = (permission: (typeof permissions)[0]) => {
    // If no modules are selected, all modules are allowed
    if (selectedModules.length === 0) {
      // If no actions are selected, all actions are allowed
      if (selectedActions.length === 0) return true;
      // Otherwise, check if the action is allowed
      return selectedActions.includes(permission.action);
    }
    // If modules are selected, check if the module is allowed
    if (!selectedModules.includes(permission.module)) return false;
    // If actions are selected, check if the action is allowed
    if (
      selectedActions.length > 0 &&
      !selectedActions.includes(permission.action)
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
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLocked}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLocked}
          />
        </div>
        {isLocked && (
          <div className="p-4 text-sm border rounded-lg bg-muted">
            <p className="font-medium">This is a system group</p>
            <p>
              You can manage permissions for this group, but the name and
              description cannot be modified.
            </p>
          </div>
        )}
        {name === "Administrators" && (
          <div className="p-4 text-sm border rounded-lg bg-muted border-amber-200">
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
          <div className="p-4 border rounded-lg bg-card">
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
                                    onChange={(e) => {
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
                                      !isAllowed ? "text-muted-foreground" : ""
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
                                    {!selectedModules.includes(module) && (
                                      <span className="block">
                                        • The {module} module is not selected
                                      </span>
                                    )}
                                    {selectedActions.length > 0 &&
                                      !selectedActions.includes(
                                        permission.action
                                      ) && (
                                        <span className="block">
                                          • The {permission.action} action is
                                          not allowed
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
          <div className="p-4 border rounded-lg bg-card">
            <h2 className="mb-4 text-lg font-semibold">Module Permissions</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Select which modules this group can access. If no modules are
              selected, all modules are allowed.
            </p>
            <div className="grid gap-2">
              {availableModules.map((module: string) => (
                <div key={module} className="flex items-center space-x-2">
                  <Checkbox
                    id={`module-${module}`}
                    checked={selectedModules.includes(module)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedModules([...selectedModules, module]);
                      } else {
                        setSelectedModules(
                          selectedModules.filter((m) => m !== module)
                        );
                        // Remove permissions for this module when it's unselected
                        setSelectedPermissions(
                          selectedPermissions.filter(
                            (id) =>
                              !permissions.find(
                                (p) => p.id === id && p.module === module
                              )
                          )
                        );
                      }
                    }}
                    disabled={name === "Administrators"}
                  />
                  <Label htmlFor={`module-${module}`}>{module}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border rounded-lg bg-card">
            <h2 className="mb-4 text-lg font-semibold">Action Permissions</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Select which actions this group can perform. If no actions are
              selected, all actions are allowed.
            </p>
            <div className="grid gap-2">
              {availableActions.map((action: string) => (
                <div key={action} className="flex items-center space-x-2">
                  <Checkbox
                    id={`action-${action}`}
                    checked={selectedActions.includes(action)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedActions([...selectedActions, action]);
                      } else {
                        setSelectedActions(
                          selectedActions.filter((a) => a !== action)
                        );
                        // Remove permissions for this action when it's unselected
                        setSelectedPermissions(
                          selectedPermissions.filter(
                            (id) =>
                              !permissions.find(
                                (p) => p.id === id && p.action === action
                              )
                          )
                        );
                      }
                    }}
                    disabled={name === "Administrators"}
                  />
                  <Label htmlFor={`action-${action}`}>{action}</Label>
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
