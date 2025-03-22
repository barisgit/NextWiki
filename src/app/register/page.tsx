import { dbService } from "~/lib/services";
import { RegisterForm } from "~/components/auth/RegisterForm";

export default async function RegisterPage() {
  // Fetch user count on the server
  const userCount = await dbService.users.count();

  return (
    <div className="flex h-full flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            {userCount === 0 ? "Create Admin Account" : "Create Account"}
          </h2>
          {userCount === 0 && (
            <p className="mt-2 text-center text-sm text-gray-600">
              This will be the first user and will have admin privileges
            </p>
          )}
        </div>

        <RegisterForm isFirstUser={userCount === 0} />
      </div>
    </div>
  );
}
