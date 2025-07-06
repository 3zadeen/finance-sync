import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadProgressModal({ isOpen, onClose }: UploadProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Parsing PDF content", icon: "fas fa-file-pdf" },
    { label: "Extracting transactions", icon: "fas fa-search" },
    { label: "AI categorization in progress", icon: "fas fa-robot" },
    { label: "Syncing to Google Sheets", icon: "fas fa-sync" },
  ];

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setCurrentStep(0);
      
      // Simulate processing steps
      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          
          // Update current step based on progress
          if (newProgress >= 25 && currentStep < 1) {
            setCurrentStep(1);
          } else if (newProgress >= 50 && currentStep < 2) {
            setCurrentStep(2);
          } else if (newProgress >= 75 && currentStep < 3) {
            setCurrentStep(3);
          }
          
          if (newProgress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              onClose();
            }, 1000);
            return 100;
          }
          
          return newProgress;
        });
      }, 60); // Complete in ~3.6 seconds

      return () => clearInterval(timer);
    }
  }, [isOpen, onClose, currentStep]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-file-pdf text-primary text-2xl"></i>
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">Processing Bank Statement</h3>
          <p className="text-neutral-600 text-sm mb-6">AI is categorizing your transactions...</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 rounded-full h-2 mb-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Processing Steps */}
          <div className="space-y-2 text-sm text-left">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-2">
                <i className={`${
                  index < currentStep ? "fas fa-check text-success" :
                  index === currentStep ? `${step.icon} text-primary` :
                  "fas fa-clock text-neutral-400"
                }`}></i>
                <span className={
                  index <= currentStep ? "text-neutral-600" : "text-neutral-400"
                }>
                  {step.label}
                </span>
                {index === currentStep && (
                  <i className="fas fa-spinner fa-spin text-primary ml-auto"></i>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
