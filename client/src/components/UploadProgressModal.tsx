import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadProgressModal({ isOpen, onClose }: UploadProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const queryClient = useQueryClient();

  const steps = [
    { label: "Parsing PDF content", icon: "fas fa-file-pdf" },
    { label: "Extracting transactions", icon: "fas fa-search" },
    { label: "AI categorization in progress", icon: "fas fa-robot" },
    { label: "Syncing to Google Sheets", icon: "fas fa-sync" },
  ];

  // Poll for transaction updates to detect when processing is complete
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isOpen && !isComplete,
    refetchInterval: 1000, // Poll every second
  });

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setCurrentStep(0);
      setIsComplete(false);
      
      // Simulate visual progress while waiting for real completion
      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 3, 90); // Stop at 90% until real completion
          
          // Update current step based on progress
          if (newProgress >= 25 && currentStep < 1) {
            setCurrentStep(1);
          } else if (newProgress >= 50 && currentStep < 2) {
            setCurrentStep(2);
          } else if (newProgress >= 75 && currentStep < 3) {
            setCurrentStep(3);
          }
          
          return newProgress;
        });
      }, 200);

      return () => clearInterval(timer);
    }
  }, [isOpen, currentStep]);

  // Check if processing is complete by monitoring transaction count
  useEffect(() => {
    if (stats && stats.totalTransactions > 0 && !isComplete) {
      setProgress(100);
      setCurrentStep(3);
      setIsComplete(true);
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    }
  }, [stats, isComplete, queryClient]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">Processing Bank Statement</DialogTitle>
        <DialogDescription className="sr-only">
          AI is processing your uploaded bank statement and categorizing transactions
        </DialogDescription>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className={`fas ${isComplete ? 'fa-check text-success' : 'fa-file-pdf text-primary'} text-2xl`}></i>
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            {isComplete ? 'Processing Complete!' : 'Processing Bank Statement'}
          </h3>
          <p className="text-neutral-600 text-sm mb-6">
            {isComplete 
              ? 'Your transactions have been categorized and are ready to view.' 
              : 'AI is categorizing your transactions...'
            }
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isComplete ? 'bg-success' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Processing Steps */}
          <div className="space-y-2 text-sm text-left mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-2">
                <i className={`${
                  (isComplete && index <= 3) || index < currentStep ? "fas fa-check text-success" :
                  index === currentStep && !isComplete ? `${step.icon} text-primary` :
                  "fas fa-clock text-neutral-400"
                }`}></i>
                <span className={
                  (isComplete && index <= 3) || index <= currentStep ? "text-neutral-600" : "text-neutral-400"
                }>
                  {step.label}
                </span>
                {index === currentStep && !isComplete && (
                  <i className="fas fa-spinner fa-spin text-primary ml-auto"></i>
                )}
              </div>
            ))}
          </div>

          {/* Close Button */}
          {isComplete && (
            <Button 
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary-dark text-white"
            >
              View Transactions
            </Button>
          )}
          
          {/* Cancel Button for ongoing process */}
          {!isComplete && (
            <Button 
              variant="outline"
              onClick={onClose}
              className="w-full border-neutral-200 text-neutral-600 hover:text-neutral-800"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
