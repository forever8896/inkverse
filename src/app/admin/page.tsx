import { requireAdmin } from '@/lib/admin-auth';
import AdminDashboardClient from './AdminDashboardClient';

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalCost: number;
  totalOpenAICost: number;
  totalFalCost: number;
  totalTokensUsed: number;
  avgJobTime: number;
  recentActivity: Array<{
    type: 'user_registered' | 'job_created' | 'job_completed' | 'job_failed';
    timestamp: string;
    details: string;
  }>;
}

export default async function AdminDashboard() {
  // Require admin authentication (checks both login and admin role)
  await requireAdmin();

  return <AdminDashboardClient />;
}