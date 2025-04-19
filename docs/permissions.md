# Custom Permission System Documentation

This document outlines the custom permission system used in NextWiki, providing components for controlling access based on user permissions and authentication status, along with a client-side hook for more granular checks.

## Core Components (`PermissionGate.*`)

The core permission system relies on a set of components designed for declarative permission checks, typically used in layout files or higher-order components to gate access to entire sections or pages.

These components are located in `src/components/auth/permission/`.

### 1. `PermissionGate.Root`

This is the main provider component that wraps the content you want to protect. It fetches the necessary permission context and determines which slot to render based on the user's permissions and authentication state.

**Props:**

*   `permission` (Optional `PermissionIdentifier`): The specific permission required to access the content within the `PermissionGate.Authorized` slot. If omitted, it only checks if the user is logged in.
*   `publicPaths` (Optional `string[]`): An array of pathnames (e.g., `'/login'`, `'/register'`) that should always be accessible, regardless of the permission check or authentication status. The component checks the current pathname against this list.

**Usage:**

```tsx
// Example in src/app/layout.tsx
import { Permission } from "~/components/auth/permission";

// ...

<PermissionGate.Root
  permission="wiki:page:read" // Requires read permission for wiki pages
  publicPaths={["/login", "/register", "/api/*"]} // Allows access to login/register and all api routes (see wildcard)
>
  <PermissionGate.Authorized>
    {/* Content for authorized users */}
    <MainLayout>{children}</MainLayout>
  </PermissionGate.Authorized>
  <PermissionGate.Unauthorized>
    {/* Content shown when permission is denied */}
    <AccessDenied />
  </PermissionGate.Unauthorized>
  <PermissionGate.NotLoggedIn redirectTo="/login">
    {/* Content shown when user is not logged in (optional redirect) */}
    <RedirectingToLogin />
  </PermissionGate.NotLoggedIn>
</PermissionGate.Root>
```

### 2. Slots

These components are used *inside* `PermissionGate.Root` to define what content is shown in different scenarios:

*   **`PermissionGate.Authorized`**: Renders its children if the user is logged in AND (if the `permission` prop was provided to `PermissionGate.Root`) has the required permission, OR if the current path is in `publicPaths`.
*   **`PermissionGate.Unauthorized`**: Renders its children if the user is logged in BUT lacks the required permission (and the path is not public).
*   **`PermissionGate.NotLoggedIn`**: Renders its children if the user is not logged in (and the path is not public).
    *   **Props:**
        *   `redirectTo` (Optional `string`): If provided, the component will attempt to redirect the user to this path instead of rendering its children.

## Client-Side Hook (`usePermissions`)

For more granular permission checks *within* components (e.g., showing/hiding a button, enabling/disabling a feature), you can use the `usePermissions` hook. This hook provides access to the current user's permissions on the client-side.

**Location:** `src/lib/hooks/usePermissions.tsx`

**Usage:**

The hook must be used within a component that is a descendant of the `PermissionProvider` (found in `usePermission.tsx`; not to be confused with internal `PermissionProvider` from `PermissionGate`).

**Return Values:**

*   `permissions`: Raw array of permission objects.
*   `permissionNames`: Array of permission identifier strings (`PermissionIdentifier`).
*   `permissionMap`: A Record for efficient permission lookups (`Record<PermissionIdentifier, boolean>`).
*   `isLoading`: Boolean indicating if permissions are still being fetched.
*   `hasPermission(permission: PermissionIdentifier)`: Function to check if the user has a specific permission. Returns `false` while loading.
*   `hasAnyPermission(permissions: PermissionIdentifier[])`: Function to check if the user has at least one of the specified permissions. Returns `false` while loading.
*   `reloadPermissions()`: Function to manually trigger a refetch of user permissions.

**Example:**

```tsx
"use client";

import { usePermissions } from "~/lib/hooks/usePermissions";
import { Button } from "~/components/ui/button";

function MyComponent() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div>
      {hasPermission("admin:users:create") && (
        <Button>Create New User</Button>
      )}
      {!hasPermission("admin:users:create") && (
        <p>You don't have permission to create users.</p>
      )}
    </div>
  );
}
```

## Client-Side Helper Components

Two helper components are provided for convenient conditional rendering based on permissions directly in JSX.

**Location:** `src/lib/hooks/usePermissions.tsx`

### 1. `RequirePermission`

Renders its children only if the user has the specified permission.

**Props:**

*   `permission`: The `PermissionIdentifier` required.
*   `children`: The content to render if permission is granted.
*   `fallback` (Optional): Content to render if permission is denied or during loading.

**Example:**

```tsx
import { RequirePermission } from "~/lib/hooks/usePermissions";

<RequirePermission permission="wiki:page:delete" fallback={<p>Cannot delete</p>}>
  <DeleteButton />
</RequirePermission>
```

### 2. `RequireAnyPermission`

Renders its children only if the user has at least one of the specified permissions.

**Props:**

*   `permissions`: An array of `PermissionIdentifier`s.
*   `children`: The content to render if any permission is granted.
*   `fallback` (Optional): Content to render if none of the permissions are granted or during loading.

**Example:**

```tsx
import { RequireAnyPermission } from "~/lib/hooks/usePermissions";

<RequireAnyPermission permissions={["admin:settings:edit", "owner:settings:edit"]}>
  <SettingsForm />
</RequireAnyPermission>
```

## Relationship

*   The `PermissionGate.*` components provide the foundational structure for gating access, handling the initial server-side or client-side load checks, managing authentication status, and dealing with public paths.
*   The `usePermissions` hook and the `Require*` helper components consume this context on the client-side, allowing for dynamic UI adjustments based on the user's specific permissions within already authorized sections of the application.  Must be used within a component that is a descendant of the `PermissionProvider` (found in `usePermission.tsx`; not to be confused with internal `PermissionProvider` from `PermissionGate`).