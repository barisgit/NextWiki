"use client";

import { useState } from "react";

interface Permission {
  id: number;
  name: string;
  description: string | null;
  module: string;
  action: string;
}

interface PermissionsTableProps {
  permissions: Permission[];
}

export default function PermissionsTable({
  permissions,
}: PermissionsTableProps) {
  const [filter, setFilter] = useState("");

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
          p.name.toLowerCase().includes(lowerCaseFilter) ||
          (p.description?.toLowerCase() || "").includes(lowerCaseFilter) ||
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          (p.description?.toLowerCase() || "").includes(filter.toLowerCase()) ||
          p.action.toLowerCase().includes(filter.toLowerCase())
      )
    );
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search permissions..."
          className="w-full p-2 border rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {filteredModules.length === 0 ? (
        <div className="py-4 text-center text-text-secondary">
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
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Action</th>
                    <th className="p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedPermissions[module]
                    ?.filter(
                      (p) =>
                        !filter ||
                        p.name.toLowerCase().includes(filter.toLowerCase()) ||
                        (p.description?.toLowerCase() || "").includes(
                          filter.toLowerCase()
                        ) ||
                        p.action.toLowerCase().includes(filter.toLowerCase())
                    )
                    .map((permission) => (
                      <tr
                        key={permission.id}
                        className="border-b border-background-level2"
                      >
                        <td className="p-2 font-mono text-sm">
                          {permission.name}
                        </td>
                        <td className="p-2 capitalize">{permission.action}</td>
                        <td className="p-2 text-sm text-text-secondary">
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
