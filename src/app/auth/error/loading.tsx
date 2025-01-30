export default function AuthErrorLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 border border-border animate-pulse">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-6 w-6 bg-muted rounded-full" />
          <div className="h-6 w-32 bg-muted rounded" />
        </div>

        <div className="h-4 w-3/4 bg-muted rounded mb-6" />

        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}