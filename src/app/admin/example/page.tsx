import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PermissionGate } from "~/components/auth/permission";
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
    <div className="container p-6 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Permission Examples</h1>

      <div className="p-6 mb-6 rounded-lg shadow-sm bg-background-level1">
        <h2 className="mb-4 text-xl font-semibold">Single Permission Check</h2>

        <PermissionGate.Root permission="wiki:page:read">
          <PermissionGate.Authorized>
            <div className="p-4 rounded bg-success-light text-success">
              You have permission to read wiki pages.
            </div>
          </PermissionGate.Authorized>
          <PermissionGate.Unauthorized>
            <div className="p-4 rounded bg-warning-light text-warning">
              You do not have permission to read wiki pages.
            </div>
          </PermissionGate.Unauthorized>
        </PermissionGate.Root>
      </div>

      <div className="p-6 mb-6 rounded-lg shadow-sm bg-background-level1">
        <h2 className="mb-4 text-xl font-semibold">
          Multiple Permissions Check (Any)
        </h2>

        <PermissionGate.Root
          permissions={["wiki:page:create", "wiki:page:update"]}
        >
          <PermissionGate.Authorized>
            <div className="p-4 rounded bg-success-light text-success">
              You have permission to create or update wiki pages.
            </div>
          </PermissionGate.Authorized>
          <PermissionGate.Unauthorized>
            <div className="p-4 rounded bg-warning-light text-warning">
              You do not have permission to create or update wiki pages.
            </div>
          </PermissionGate.Unauthorized>
        </PermissionGate.Root>
      </div>

      <div className="p-6 rounded-lg shadow-sm bg-background-level1">
        <h2 className="mb-4 text-xl font-semibold">With Redirect Example</h2>
        <p className="mb-6 text-sm text-text-secondary">
          In this example, if you don&apos;t have admin permissions, you would
          be redirected to the login page. Since we want to show this example,
          we&apos;re not using the redirect here, but it would look like:
        </p>
        <pre className="p-4 overflow-x-auto rounded bg-code-bg text-code-text">
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

      <div className="p-6 mt-6 rounded-lg shadow-sm bg-background-level1">
        <h2 className="mb-4 text-xl font-semibold">
          Client-side permission checking
        </h2>
        <PermissionsExample />
      </div>
    </div>
  );
}
