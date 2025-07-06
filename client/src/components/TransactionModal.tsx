import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest("PATCH", `/api/transactions/${transaction.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/category-breakdown"] });
      toast({
        title: "Transaction updated",
        description: "Changes have been saved successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || "");
      setAmount(Math.abs(parseFloat(transaction.amount || "0")).toFixed(2));
      setCategoryId(transaction.categoryId?.toString() || "");
    }
  }, [transaction]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a transaction description",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Keep the original sign (positive/negative)
    const originalAmount = parseFloat(transaction.amount || "0");
    const signedAmount = originalAmount < 0 ? -numericAmount : numericAmount;

    updateMutation.mutate({
      description: description.trim(),
      amount: signedAmount.toString(),
      categoryId: categoryId ? parseInt(categoryId) : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-800">
            Edit Transaction
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-neutral-700">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              placeholder="Transaction description"
            />
          </div>
          
          <div>
            <Label htmlFor="category" className="text-sm font-medium text-neutral-700">
              Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <i className={`${category.icon} text-sm`} style={{ color: category.color }}></i>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-neutral-700">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
              placeholder="0.00"
            />
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary-dark text-white"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              className="px-4 border-neutral-200 text-neutral-600 hover:text-neutral-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
