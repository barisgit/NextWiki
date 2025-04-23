import { Metadata } from "next";
import { SettingsPage } from "./components/settings-page";

export const metadata: Metadata = {
  title: "Settings | Admin | NextWiki",
  description: "Manage system settings for NextWiki",
};

export default function AdminSettingsPage() {
  return (
    <div className="p-4">
      <SettingsPage />
    </div>
  );
}
