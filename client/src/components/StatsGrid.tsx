import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-neutral-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="shadow-card border border-neutral-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {stats?.totalTransactions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
              <i className="fas fa-receipt text-primary"></i>
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-success text-sm font-medium">+12%</span>
            <span className="text-neutral-600 text-sm ml-2">vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border border-neutral-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Auto-Categorized</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {stats?.autoCategorizedPercentage || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-success"></i>
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-success text-sm font-medium">+5%</span>
            <span className="text-neutral-600 text-sm ml-2">accuracy</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border border-neutral-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Last Sync</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">2 min ago</p>
            </div>
            <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
              <i className="fas fa-sync-alt text-accent"></i>
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-success text-sm font-medium">
              <i className="fas fa-check-circle mr-1"></i>
              Synced
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border border-neutral-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-neutral-800 mt-1">
                {stats?.pendingReview || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
              <i className="fas fa-eye text-warning"></i>
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-warning text-sm font-medium">Needs attention</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
