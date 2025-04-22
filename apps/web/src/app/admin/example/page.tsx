import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PermissionGate } from "~/components/auth/permission/server";
import { PermissionsExample } from "~/components/auth/PermissionsExample";
import { env } from "~/env";

export const metadata: Metadata = {
  title: "Permission Examples | NextWiki",
  description: "Server-side permission checking examples",
};

export default function PermissionExamplesPage() {
  if (env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Permission Examples</h1>

      <div className="bg-background-level1 mb-6 rounded-lg p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Single Permission Check</h2>

        <PermissionGate permission="wiki:page:read">
          <PermissionGate.Authorized>
            <div className="bg-success-light text-success rounded p-4">
              You have permission to read wiki pages.
            </div>
          </PermissionGate.Authorized>
          <PermissionGate.Unauthorized>
            <div className="bg-warning-light text-warning rounded p-4">
              You do not have permission to read wiki pages.
            </div>
          </PermissionGate.Unauthorized>
        </PermissionGate>
      </div>

      <div className="bg-background-level1 mb-6 rounded-lg p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          Multiple Permissions Check (Any)
        </h2>

        <PermissionGate permissions={["wiki:page:create", "wiki:page:update"]}>
          <PermissionGate.Authorized>
            <div className="bg-success-light text-success rounded p-4">
              You have permission to create or update wiki pages.
            </div>
          </PermissionGate.Authorized>
          <PermissionGate.Unauthorized>
            <div className="bg-warning-light text-warning rounded p-4">
              You do not have permission to create or update wiki pages.
            </div>
          </PermissionGate.Unauthorized>
        </PermissionGate>
      </div>

      <div className="bg-background-level1 rounded-lg p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">With Redirect Example</h2>
        <p className="text-text-secondary mb-6 text-sm">
          In this example, if you don&apos;t have admin permissions, you would
          be redirected to the login page. Since we want to show this example,
          we&apos;re not using the redirect here, but it would look like:
        </p>
        <pre className="bg-code-bg text-code-text overflow-x-auto rounded p-4">
          {`<PermissionGate.Root
  permission="system:admin:access" 
>
  <PermissionGate.Authorized>
    Admin content here
  </PermissionGate.Authorized>
  <PermissionGate.Unauthorized redirectTo="/login">
    Redirecting to login...
  </PermissionGate.Unauthorized>
</PermissionGate.Root>`}
        </pre>
      </div>

      <div className="bg-background-level1 mt-6 rounded-lg p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          Client-side permission checking
        </h2>
        <PermissionsExample />
      </div>
    </div>
  );
}
