import { getWaitlistStats } from './actions';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const statsResult = await getWaitlistStats();
  const stats = statsResult.success ? statsResult.data : null;
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Waitlist Card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">Waitlist</h3>
            </div>
            {stats ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Manage and monitor the user waitlist
                </p>
                <div className="mt-4">
                  <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Signups
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-foreground">
                        {stats.total}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Active
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-foreground">
                        {stats.byStatus.active || 0}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-6">
                  <Link 
                    href="/admin/waitlist" 
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    View Waitlist
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="text-muted-foreground">No data available</div>
                <div className="mt-4">
                  <Link 
                    href="/admin/waitlist" 
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    View Waitlist
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activity Card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">Recent Signups</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Daily waitlist signups over the last 7 days
            </p>
            {stats && stats.dailySignups.length > 0 ? (
              <div className="mt-4 space-y-2">
                {stats.dailySignups.map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(day.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-2"
                        style={{ position: 'relative' }}
                      >
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.min(100, (day.count / (stats.total || 1) * 100) * 3)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm font-medium">
                        {day.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                No recent signups
              </div>
            )}
          </div>
        </div>
        
        {/* Status Breakdown Card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">Status Breakdown</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Waitlist entries by status
            </p>
            {stats ? (
              <div className="mt-4 space-y-3">
                {['active', 'contacted', 'converted', 'unsubscribed'].map((status) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="capitalize text-sm text-gray-600 dark:text-gray-400">
                      {status}
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-2"
                        style={{ position: 'relative' }}
                      >
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((stats.byStatus[status] || 0) / (stats.total || 1) * 100))}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-sm font-medium">
                        {stats.byStatus[status] || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
