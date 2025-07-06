import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function CategoryBreakdown() {
  const { data: breakdown, isLoading } = useQuery({
    queryKey: ["/api/category-breakdown"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-card border border-neutral-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Category Breakdown</h3>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getColorDot = (color: string) => {
    // Convert hex color to inline style
    return { backgroundColor: color };
  };

  return (
    <Card className="shadow-card border border-neutral-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Category Breakdown</h3>
        
        <div className="space-y-4">
          {breakdown?.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={getColorDot(item.categoryColor)}
                ></div>
                <span className="text-neutral-700">{item.categoryName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-neutral-800">${item.total}</span>
                {item.categoryName === "Uncategorized" && parseFloat(item.total) > 0 && (
                  <i className="fas fa-exclamation-triangle text-warning text-sm"></i>
                )}
              </div>
            </div>
          ))}
          
          {(!breakdown || breakdown.length === 0) && (
            <div className="text-center py-8 text-neutral-500">
              <i className="fas fa-chart-pie text-2xl mb-2"></i>
              <p>No transactions yet</p>
              <p className="text-sm">Upload a bank statement to see your spending breakdown</p>
            </div>
          )}
        </div>
        
        <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary-dark font-medium text-sm">
          Manage Categories
        </Button>
      </CardContent>
    </Card>
  );
}
