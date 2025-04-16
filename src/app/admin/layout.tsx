import { AdminLayout } from "~/components/layout/AdminLayout";

export default function layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
