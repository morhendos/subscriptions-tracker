import { getWaitlistStats } from './actions';
import Link from 'next/link';
import { CalendarIcon, UsersIcon, ClockIcon, CheckIcon, UserPlusIcon } from 'lucide-react';

export default async function AdminDashboardPage() {
  const statsResult = await getWaitlistStats();
  const stats = statsResult.success ? statsResult.data : null;
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your subscription tracker system</p>
        </div>
        <Link 
          href="/admin/waitlist" 
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <UsersIcon className="h-4 w-4" />
          Manage Waitlist
        </Link>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          <>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Total Waitlist</h3>
                <UserPlusIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.dailySignups && stats.dailySignups.length > 0 ? 
                  `+${stats.dailySignups.reduce((total, day) => total + day.count, 0)} in the last week` : 
                  'No recent signups'}
              </p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Active Signups</h3>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.byStatus.active || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? 
                  `${Math.round(((stats.byStatus.active || 0) / stats.total) * 100)}% of total signups` : 
                  'No active signups'}
              </p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Contacted</h3>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.byStatus.contacted || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Users you've reached out to
              </p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Converted</h3>
                <CheckIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.byStatus.converted || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.byStatus.active ? 
                  `${Math.round(((stats.byStatus.converted || 0) / (stats.byStatus.active || 1)) * 100)}% conversion rate` : 
                  'No conversions yet'}
              </p>
            </div>
          </>
        ) : (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted/60 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-muted/60 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-muted/60 rounded animate-pulse mt-2"></div>
              <div className="h-3 w-32 bg-muted/60 rounded animate-pulse mt-3"></div>
            </div>
          ))
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Signups Chart */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Signups</h3>
              <div className="text-xs font-medium text-muted-foreground">Last 7 days</div>
            </div>
            {stats && stats.dailySignups ? (
              <div className="mt-4 h-[240px]">
                {stats.dailySignups.length > 0 ? (
                  <div className="space-y-4">
                    {stats.dailySignups.map((day: any) => {
                      const maxValue = Math.max(...stats.dailySignups.map((d: any) => d.count));
                      const percentage = Math.max(5, (day.count / (maxValue || 1)) * 100);
                      
                      return (
                        <div key={day.date} className="flex items-center gap-2">
                          <div className="w-16 text-xs text-muted-foreground">
                            {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div 
                                className="h-2 rounded-full bg-primary" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-9 text-xs font-medium">{day.count}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">No recent signups</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 h-[240px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Breakdown */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium">Status Breakdown</h3>
            
            {stats ? (
              <div className="mt-4 h-[240px]">
                {stats.total > 0 ? (
                  <div className="grid grid-cols-1 gap-8">
                    {[
                      { status: 'active', label: 'Active', color: 'bg-blue-500' },
                      { status: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
                      { status: 'converted', label: 'Converted', color: 'bg-green-500' },
                      { status: 'unsubscribed', label: 'Unsubscribed', color: 'bg-gray-400' }
                    ].map(item => {
                      const count = stats.byStatus[item.status] || 0;
                      const percentage = Math.round((count / stats.total) * 100);
                      
                      return (
                        <div key={item.status} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <span className="text-sm font-medium">{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div 
                              className={`h-2 rounded-full ${item.color}`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 h-[240px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Recent Entries Quick View */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-lg font-medium">Recent Waitlist Entries</h3>
          <p className="text-sm text-muted-foreground">
            The most recent additions to your waitlist
          </p>
        </div>
        <div className="p-0">
          {stats && stats.total > 0 ? (
            <div className="relative w-full overflow-auto">
              <div className="flex justify-center p-6 text-sm text-muted-foreground">
                <Link 
                  href="/admin/waitlist" 
                  className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  View All Entries
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">No waitlist entries found</p>
              <Link 
                href="/admin/waitlist" 
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Go to Waitlist Management
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
