import { dbService } from "~/lib/services";
import { RegisterForm } from "~/components/auth/RegisterForm";

export default async function RegisterPage() {
  // Fetch user count on the server
  const userCount = await dbService.users.count();

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 py-12 sm:px-6 lg:px-8 bg-background-paper">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-center">
            {userCount === 0 ? "Create Admin Account" : "Create Account"}
          </h2>
          {userCount === 0 && (
            <p className="mt-2 text-sm text-center text-text-secondary">
              This will be the first user and will have admin privileges
            </p>
          )}
        </div>

        <RegisterForm isFirstUser={userCount === 0} />
      </div>
    </div>
  );
}
