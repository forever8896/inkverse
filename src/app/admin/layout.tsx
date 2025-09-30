import { requireAdmin } from '@/lib/admin-auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require admin authentication for all admin pages
  await requireAdmin();

  return <>{children}</>;
}