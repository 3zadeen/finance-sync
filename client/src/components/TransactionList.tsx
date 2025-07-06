import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface TransactionListProps {
  onEditTransaction: (transaction: any) => void;
}

export default function TransactionList({ onEditTransaction }: TransactionListProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-card border border-neutral-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (categoryName?: string) => {
    const iconMap: Record<string, string> = {
      "Groceries": "fas fa-shopping-cart",
      "Housing": "fas fa-home",
      "Transportation": "fas fa-gas-pump",
      "Entertainment": "fas fa-film",
      "Utilities": "fas fa-bolt",
      "Healthcare": "fas fa-heartbeat",
      "Uncategorized": "fas fa-question",
    };
    return iconMap[categoryName || "Uncategorized"] || "fas fa-question";
  };

  const getCategoryColor = (categoryColor?: string) => {
    if (!categoryColor) return "bg-orange-100 text-orange-600";
    
    // Convert hex to Tailwind-like classes - simplified mapping
    const colorMap: Record<string, string> = {
      "#3B82F6": "bg-blue-100 text-blue-600",
      "#10B981": "bg-green-100 text-green-600", 
      "#EF4444": "bg-red-100 text-red-600",
      "#8B5CF6": "bg-purple-100 text-purple-600",
      "#F59E0B": "bg-yellow-100 text-yellow-600",
      "#EC4899": "bg-pink-100 text-pink-600",
      "#F97316": "bg-orange-100 text-orange-600",
    };
    
    return colorMap[categoryColor] || "bg-gray-100 text-gray-600";
  };

  const getCategoryBadgeColor = (categoryColor?: string) => {
    if (!categoryColor) return "bg-orange-100 text-orange-700";
    
    const badgeColorMap: Record<string, string> = {
      "#3B82F6": "bg-blue-100 text-blue-700",
      "#10B981": "bg-green-100 text-green-700",
      "#EF4444": "bg-red-100 text-red-700", 
      "#8B5CF6": "bg-purple-100 text-purple-700",
      "#F59E0B": "bg-yellow-100 text-yellow-700",
      "#EC4899": "bg-pink-100 text-pink-700",
      "#F97316": "bg-orange-100 text-orange-700",
    };
    
    return badgeColorMap[categoryColor] || "bg-gray-100 text-gray-700";
  };

  return (
    <Card className="shadow-card border border-neutral-200">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-800">Recent Transactions</h3>
          <div className="flex items-center space-x-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-neutral-800">
              <i className="fas fa-download"></i>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-neutral-200">
        {transactions?.map((transaction: any) => (
          <div 
            key={transaction.id} 
            className={`p-4 hover:bg-neutral-50 transition-colors ${
              transaction.needsReview ? "border-l-4 border-warning" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  getCategoryColor(transaction.category?.color)
                }`}>
                  <i className={`${getCategoryIcon(transaction.category?.name)} text-sm`}></i>
                </div>
                <div>
                  <p className="font-medium text-neutral-800">{transaction.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      getCategoryBadgeColor(transaction.category?.color)
                    }`}>
                      {transaction.category?.name || "Uncategorized"}
                    </span>
                    <span className="text-neutral-500 text-sm">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                    {transaction.needsReview && (
                      <span className="text-warning text-xs font-medium">Needs Review</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-neutral-800">
                  {parseFloat(transaction.amount) < 0 ? "-" : "+"}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEditTransaction(transaction)}
                  className={`text-sm ${
                    transaction.needsReview 
                      ? "text-warning hover:text-orange-700" 
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <i className="fas fa-edit"></i>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-neutral-200">
        <Button variant="ghost" className="w-full text-primary hover:text-primary-dark font-medium py-2">
          Load More Transactions
        </Button>
      </div>
    </Card>
  );
}
