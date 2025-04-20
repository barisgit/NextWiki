# Custom Permission System Documentation

This document outlines the custom permission system used in NextWiki, providing components for controlling access based on user permissions and authentication status, both on the server and client side.

## General Overview

The permission system is built upon several core concepts:

1.  **Permission Registry (`src/lib/permissions/registry.ts`):** A central TypeScript file defining all available permissions in the system using a structured format (`module:resource:action`, e.g., `wiki:page:read`). This registry is the single source of truth for what permissions *can* exist.
2.  **Database Schema (`src/lib/db/schema.ts`):**
    *   `permissions`: Stores the permissions defined in the registry, adding a unique ID.
    *   `groups`: Defines user groups (e.g., Administrators, Editors, Viewers, Guests).
    *   `userGroups`: Links users to groups (many-to-many).
    *   `groupPermissions`: Links groups to specific permissions (many-to-many).
    *   `groupModulePermissions`, `groupActionPermissions`: Allow broader permissions based on module or action for a group (experimental/potentially less used).
    *   `pagePermissions`: Allows overriding permissions on a per-page basis (not fully covered in this doc).
3.  **Seeding (`src/lib/db/seeds/permissions.ts`):** Scripts to populate the `permissions` table from the registry and create default groups (`Administrators`, `Editors`, `Viewers`, `Guests`) with sensible default permission assignments.
4.  **Services:**
    *   `permissionService (`src/lib/services/permissions.ts`): Basic CRUD for the `permissions` table.
    *   `authorizationService` (`src/lib/services/authorization.ts`): The core logic for checking if a user (or guest) has a specific permission based on their group memberships and the permissions assigned to those groups. Handles fetching user groups and querying relevant permission tables.
5.  **Components (`src/components/auth/permission/`):** React components (both Server and Client) that utilize the `authorizationService` or the client-side `PermissionProvider` context to enforce access control declaratively in the UI.

## Server-Side Components

These components run on the server and provide the primary mechanism for enforcing access control before rendering a page or layout.

### `PermissionGate`

**Location:** `src/components/auth/permission/server/gate.tsx`

This is an asynchronous Server Component designed for robust permission checks, typically used in layout files (`src/app/layout.tsx`) or higher-order components to gate access to entire sections or pages based on server-side session and permission data. It automatically detects the current pathname using request headers.

**Props:**

*   `permission` (Optional `PermissionIdentifier`): The specific permission required to access the `Authorized` slot.
*   `permissions` (Optional `PermissionIdentifier[]`): An array of permissions. Access is granted if the user has *any* of these permissions. Use either `permission` or `permissions`, not both.
*   `publicPaths` (Optional `string[]`): An array of pathnames (e.g., `'/login'`, `'/register'`, `'/api/*'`) that should always be accessible, regardless of the permission check or authentication status. Supports wildcards. Automatically checks against the current path from headers.
*   `allowGuests` (Optional `boolean`, default: `false`): If `true`, allows unauthenticated users access if they have the required guest permissions defined in the system.
*   `children`: Must contain the slot components (`Authorized`, `Unauthorized`, `NotLoggedIn`).

**Slots (Used as Children):**

These components are used *inside* `PermissionGate` to define what content is shown or action is taken:

*   **`PermissionGate.Authorized`**: Renders its children if the user is authorized (has permission or path is public).
*   **`PermissionGate.Unauthorized`**: Renders its children if the user is logged in BUT lacks the required permission (and the path is not public).
    *   `redirectTo` (Optional `string`): If provided, performs a server-side redirect to this path instead of rendering children.
*   **`PermissionGate.NotLoggedIn`**: Renders its children if the user is not logged in (and the path is not public).
    *   `redirectTo` (Optional `string`): If provided, performs a server-side redirect to this path instead of rendering children.

**Usage Example (`src/app/layout.tsx`):**

```tsx
import { PermissionGate } from "~/components/auth/permission/server";
import { LogOutButton } from "~/components/auth/LogOutButton";
import RootLayoutContent from "./RootLayoutContent"; // Example main content

// ...

<PermissionGate
  permission="wiki:page:read" // Requires this permission
  publicPaths={["/login", "/register", "/api/*"]} // Exempt paths
  allowGuests={true} // Allow access based on guest permissions if applicable
>
  <PermissionGate.Authorized>
    <RootLayoutContent>{children}</RootLayoutContent>
  </PermissionGate.Authorized>
  <PermissionGate.Unauthorized redirectTo="/access-denied">
    {/* Fallback content if redirect isn't used, or displayed briefly */}
    <p>Access Denied Content</p>
  </PermissionGate.Unauthorized>
  <PermissionGate.NotLoggedIn redirectTo="/login">
    {/* Fallback content if redirect isn't used, or displayed briefly */}
    <p>Redirecting to Login...</p>
  </PermissionGate.NotLoggedIn>
</PermissionGate>
```

### `RequirePermission`

**Location:** `src/components/auth/permission/server/require.tsx`

A simpler asynchronous Server Component for conditionally rendering a specific piece of UI based on a *single* permission check. It uses the `authorizationService` directly.

**Props:**

*   `permission` (`PermissionIdentifier`): The permission required.
*   `pathname` (`string`): **Required.** The *current* pathname must be explicitly provided to check against `publicPaths`.
*   `publicPaths` (Optional `string[]`): An array of pathnames exempt from the permission check.
*   `allowGuests` (Optional `boolean`, default: `false`): Considers guest permissions.
*   `children`: The content to render if permission is granted (or path is public).

**Behavior:** Renders `children` if the user has the permission or the `pathname` is in `publicPaths`. Otherwise, it renders `null`.

**Usage Example (Inside a Server Component):**

```tsx
import { RequirePermission } from "~/components/auth/permission/server";
import { headers } from "next/headers"; // Needed to get pathname

async function MyServerComponent() {
  const headersList = headers();
  const pathname = headersList.get("x-url") || "/"; // Get current path

  return (
    <div>
      <h2>Admin Section</h2>
      <RequirePermission
        permission="system:settings:update"
        pathname={pathname} // Pass the current path
      >
        <p>You can update settings.</p>
        {/* <SettingsForm /> */}
      </RequirePermission>
      <RequirePermission
        permission="system:users:read"
        pathname={pathname}
      >
        <p>You can view users.</p>
        {/* <UserList /> */}
      </RequirePermission>
    </div>
  );
}
```

## Client-Side Permission Management

Client-side components rely on a provider to fetch and distribute permission state.

### `PermissionProvider`

**Location:** `src/components/auth/permission/provider.tsx` (Exported via `client/index.ts`)

This Client Component fetches the current user's permissions using tRPC (`auth.getMyPermissions`) based on their `next-auth` session status. It wraps the application (typically in `src/providers/index.tsx`) and makes permission data available via React Context.

**Setup (`src/providers/index.tsx`):**

```tsx
"use client";
// ... other imports
import { PermissionProvider } from "~/components/auth/permission/client";

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TRPCClientProvider>
          <PermissionProvider> {/* <--- PermissionProvider wraps content */}
            <ModalProvider>
              {children}
              <ToasterWithTheme />
            </ModalProvider>
          </PermissionProvider>
        </TRPCClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### `usePermissions` Hook

**Location:** `src/components/auth/permission/utils/usePermissions.ts`

This hook is the standard way to access the permission context provided by `PermissionProvider`. It **must** be used within a Client Component that is a descendant of `PermissionProvider`.

**Return Values (Context Data):**

*   `permissions`: Raw array of user's permission objects (`Permission[]`).
*   `permissionNames`: Array of permission identifier strings (`PermissionIdentifier[]`).
*   `permissionMap`: A Record for efficient lookups (`Record<PermissionIdentifier, boolean>`).
*   `isLoading`: Boolean indicating if session status or permissions are still being fetched.
*   `isGuest`: Boolean, `true` if the user is unauthenticated (`useSession` status is "unauthenticated").
*   `isAuthenticated`: Boolean, `true` if the user is authenticated (`useSession` status is "authenticated").
*   `hasPermission(permission: PermissionIdentifier)`: Function to check if the user has a specific permission. Returns `false` while loading.
*   `hasAnyPermission(permissions: PermissionIdentifier[])`: Function to check if the user has at least one of the specified permissions. Returns `false` while loading or if the input array is empty.
*   `reloadPermissions()`: Function to manually trigger a refetch of user permissions.

**Usage Example (Inside a Client Component):**

```tsx
"use client";

import { usePermissions } from "~/components/auth/permission/utils/usePermissions";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

function MyToolbar() {
  // Consumes context from PermissionProvider higher up the tree
  const { hasPermission, isLoading, isAuthenticated } = usePermissions();

  if (isLoading) {
    return <Skeleton className="h-8 w-24" />; // Show loading state
  }

  if (!isAuthenticated) {
    return <p>Please log in to see actions.</p>;
  }

  return (
    <div>
      {hasPermission("admin:users:create") ? (
        <Button>Create User</Button>
      ) : (
        <Button disabled title="You lack permission">Create User</Button>
      )}
      {/* Other toolbar items */}
    </div>
  );
}
```

## Client-Side Components

These Client Components utilize the `PermissionProvider` context for dynamically showing/hiding UI elements based on permissions. They provide *UI-level control only* and do not offer true security on their own (sensitive data/actions should always be protected server-side).

### `ClientPermissionGate`

**Location:** `src/components/auth/permission/client/gate.tsx`

A client-side equivalent to `PermissionGate`, using the same slot-based approach (`Authorized`, `Unauthorized`, `NotLoggedIn`). It renders content based on the permissions available in the `PermissionContext`. Useful for controlling larger UI sections on the client without needing server-side checks for every interaction.

**Props:**

*   `permission` (Optional `PermissionIdentifier`): Check for a single permission.
*   `permissions` (Optional `PermissionIdentifier[]`): Check if the user has *any* permission in the list. Use either `permission` or `permissions`.
*   `publicPaths` (Optional `string[]`): Client-side check using `usePathname`. If the current path matches, the `Authorized` slot is rendered regardless of permissions.
*   `allowGuests` (Optional `boolean`, default: `false`): If `true`, considers guest status from the context.
*   `children`: Must contain the slot components (`Authorized`, `Unauthorized`, `NotLoggedIn`).

**Slots (Used as Children):**

*   **`ClientPermissionGate.Authorized`**: Renders children if authorized based on context/props.
*   **`ClientPermissionGate.Unauthorized`**: Renders children if authenticated but lacks permission (and path not public).
    *   `redirectTo` (Optional `string`): If provided, performs a *client-side* redirect using `useRouter` instead of rendering children.
*   **`ClientPermissionGate.NotLoggedIn`**: Renders children if unauthenticated (and path not public).
    *   `redirectTo` (Optional `string`): If provided, performs a *client-side* redirect instead of rendering children.

### `ClientRequirePermission`

**Location:** `src/components/auth/permission/client/require.tsx`

A simpler Client Component for conditionally rendering a specific piece of UI based on a *single* permission check.

**Props:**

*   `permission` (`PermissionIdentifier`): The permission required.
*   `publicPaths` (Optional `string[]`): Client-side path check.
*   `allowGuests` (Optional `boolean`, default: `false`): Considers guest status.
*   `children`: The content to render if permission is granted (or path is public).
*   `fallback` (Optional `ReactNode`): Content to render if permission is denied or during loading. Defaults to `null`.

**Usage Example:**

```tsx
import { ClientRequirePermission } from "~/components/auth/permission/client";
import { DeleteButton } from "./DeleteButton";

function PageActions({ pageId }: { pageId: string }) {
  return (
    <div>
      {/* Other actions */}
      <ClientRequirePermission
        permission="wiki:page:delete"
        fallback={<p>You cannot delete this page.</p>}
      >
        <DeleteButton pageId={pageId} />
      </ClientRequirePermission>
    </div>
  );
}
```

## Relationship & Use Cases

*   **`PermissionGate` (Server):** Use in layouts (`layout.tsx`) for primary, secure access control to pages/routes. Handles initial load protection and server-side redirects. Best for gating entire pages/sections.
*   **`RequirePermission` (Server):** Use within Server Components when you need to conditionally render smaller parts of the UI based on permissions, without the complexity of slots or redirects. Requires manual path checking if `publicPaths` is used.
*   **`PermissionProvider` (Client):** Essential setup component. Wrap your application (in `src/providers/index.tsx`) to enable client-side permission checks. Fetches and provides the context.
*   **`usePermissions` (Client Hook):** Use within Client Components (that are descendants of `PermissionProvider`) to get fine-grained access to permission state (`isLoading`, `isGuest`, `hasPermission`, etc.) for conditional logic or rendering.
*   **`ClientPermissionGate` (Client):** Use within Client Components when you need the slot-based pattern (`Authorized`, `Unauthorized`, `NotLoggedIn`) for larger UI sections, potentially with client-side redirects. UI only.
*   **`ClientRequirePermission` (Client):** Use within Client Components for the common case of simply showing/hiding a small element (like a button or menu item) based on a single permission. UI only.

**Security Note:** Client-side checks (`usePermissions`, `ClientPermissionGate`, `ClientRequirePermission`) are for UI convenience only. Always enforce critical security rules and data access on the server-side using `PermissionGate`, `RequirePermission`, or directly within your API routes/server actions using `authorizationService`.