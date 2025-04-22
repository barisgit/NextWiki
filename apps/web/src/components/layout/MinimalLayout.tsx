import { Header } from "./Header";

interface MinimalLayoutProps {
  children: React.ReactNode;
  header?: boolean;
}

export function MinimalLayout({ children, header = true }: MinimalLayoutProps) {
  return (
    <div className="h-screen w-full">
      {header && <Header />}
      <main>{children}</main>
    </div>
  );
}
