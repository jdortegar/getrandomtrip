import AdminShell from "../AdminLayoutClient";

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
