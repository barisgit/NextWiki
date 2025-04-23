"use client";

import { useState } from "react";

interface Permission {
  id: number;
  description: string | null;
  module: string;
  action: string;
  resource: string;
}

interface PermissionsTableProps {
  permissions: {
    id: number;
    description: string | null;
    resource: string;
    action: { name: string };
    module: { name: string };
  }[];
}

export default function PermissionsTable({
  permissions: rawPermissions,
}: PermissionsTableProps) {
  const [filter, setFilter] = useState("");

  // Map rawPermissions to the local Permission structure
  const permissions: Permission[] = rawPermissions.map((p) => ({
    id: p.id,
    description: p.description,
    module: p.module.name,
    action: p.action.name,
    resource: p.resource,
  }));

  // Group permissions by module
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module]?.push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  // Filter permissions based on search
  const filteredModules = Object.keys(groupedPermissions).filter((module) => {
    if (!filter) return true;

    const lowerCaseFilter = filter.toLowerCase();
    const modulePermissions = groupedPermissions[module];
    return (
      module.toLowerCase().includes(lowerCaseFilter) ||
      modulePermissions?.some(
        (p) =>
          p.resource.toLowerCase().includes(lowerCaseFilter) ||
          (p.description?.toLowerCase() || "").includes(lowerCaseFilter) ||
          p.action.toLowerCase().includes(lowerCaseFilter)
      )
    );
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search permissions by module, resource, action, or description..."
          className="w-full rounded border p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {filteredModules.length === 0 ? (
        <div className="text-text-secondary py-4 text-center">
          No permissions found matching your search.
        </div>
      ) : (
        filteredModules.map((module) => (
          <div key={module} className="mb-6">
            <h3 className="mb-2 text-lg font-medium capitalize">{module}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-background-level3">
                    <th className="p-2 text-left">Resource</th>
                    <th className="p-2 text-left">Action</th>
                    <th className="p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedPermissions[module]
                    ?.filter(
                      (p) =>
                        !filter ||
                        p.resource
                          .toLowerCase()
                          .includes(filter.toLowerCase()) ||
                        (p.description?.toLowerCase() || "").includes(
                          filter.toLowerCase()
                        ) ||
                        p.action.toLowerCase().includes(filter.toLowerCase())
                    )
                    .map((permission) => (
                      <tr
                        key={permission.id}
                        className="border-background-level2 border-b"
                      >
                        <td className="p-2 font-mono text-sm">
                          {permission.resource}
                        </td>
                        <td className="p-2 capitalize">{permission.action}</td>
                        <td className="text-text-secondary p-2 text-sm">
                          {permission.description || "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
