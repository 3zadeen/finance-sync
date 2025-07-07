import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadCardProps {
  onUploadStart: () => void;
}

export default function UploadCard({ onUploadStart }: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      onUploadStart();

      const formData = new FormData();
      formData.append('file', file);

      // Use Supabase Edge Function for PDF processing in production, local API in development
      const uploadUrl = import.meta.env.VITE_SUPABASE_URL 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pdf-processor`
        : '/api/upload-statement';
      
      console.log('Upload URL:', uploadUrl);
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
      
      const headers: Record<string, string> = {};
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
        headers["apikey"] = import.meta.env.VITE_SUPABASE_ANON_KEY;
        headers["Authorization"] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: "Your bank statement is being processed",
      });

      // The server processes in background, modal will handle completion state

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-card border border-neutral-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Upload Bank Statement</h3>
        
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleClick}
          className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-cloud-upload-alt text-primary text-xl"></i>
          </div>
          <p className="text-neutral-800 font-medium mb-2">Drop PDF here or click to browse</p>
          <p className="text-neutral-600 text-sm">Supports all major bank statement formats</p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-neutral-600">
            <i className="fas fa-shield-alt text-success mr-2"></i>
            Bank-level encryption
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <i className="fas fa-robot text-success mr-2"></i>
            AI-powered categorization
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <i className="fas fa-sync text-accent mr-2"></i>
            Auto-sync to Google Sheets
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
