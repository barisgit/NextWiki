import RegisterClientPage from "./register-page";
import { getSettingValue } from "~/lib/utils/settings";

export default async function RegisterPage({
  isFirstUser = false,
}: {
  isFirstUser?: boolean;
}) {
  const allowRegistration = await getSettingValue("auth.allowRegistration");

  if (!allowRegistration) {
    return (
      <div className="bg-background-paper flex h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
              Registration is not allowed
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-paper flex h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            {isFirstUser ? "Create Admin Account" : "Create Account"}
          </h2>
          {isFirstUser && (
            <p className="text-text-secondary mt-2 text-center text-sm">
              This will be the first user and will have admin privileges
            </p>
          )}
        </div>
      </div>
      <RegisterClientPage isFirstUser={isFirstUser} />
    </div>
  );
}
