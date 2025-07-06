import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface GoogleSheetsCardProps {
  isConnected: boolean;
  hasSpreadsheetId: boolean;
  onConnect: () => void;
}

export default function GoogleSheetsCard({ isConnected, hasSpreadsheetId, onConnect }: GoogleSheetsCardProps) {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetSpreadsheetId = async () => {
    if (!spreadsheetId.trim()) {
      toast({
        title: "Spreadsheet ID required",
        description: "Please enter your Google Sheets ID",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/set-spreadsheet-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spreadsheetId: spreadsheetId.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast({
        title: "Spreadsheet connected",
        description: "Your Google Sheet is now connected and ready for sync",
      });
      
      // Reload the page to update the connection status
      window.location.reload();
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncNow = async () => {
    if (!isConnected || !hasSpreadsheetId) {
      toast({
        title: "Not ready",
        description: "Please connect to Google Sheets and set your spreadsheet ID first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use Supabase Edge Function for Google Sheets sync in production
      const syncUrl = import.meta.env.VITE_SUPABASE_URL 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets/sync`
        : '/api/sync-google-sheets';
      
      const headers: Record<string, string> = {};
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
        headers["apikey"] = import.meta.env.VITE_SUPABASE_ANON_KEY;
        headers["Authorization"] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }

      const response = await fetch(syncUrl, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      toast({
        title: "Sync successful",
        description: "Your transactions have been synced to Google Sheets",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleViewSheet = () => {
    if (isConnected) {
      // Open Google Sheets in new tab
      window.open('https://sheets.google.com', '_blank');
    }
  };

  return (
    <Card className="shadow-card border border-neutral-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Google Sheets</h3>
        
        {isConnected && hasSpreadsheetId ? (
          <>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <i className="fab fa-google text-success"></i>
              </div>
              <div>
                <p className="font-medium text-neutral-800">Connected</p>
                <p className="text-neutral-600 text-sm">Personal Budget 2024</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Last sync:</span>
                <span className="text-neutral-800 font-medium">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Auto-sync:</span>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <span className="text-success text-xs font-medium">ON</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <Button 
                onClick={handleSyncNow}
                className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm"
              >
                Sync Now
              </Button>
              <Button 
                variant="outline"
                size="icon"
                onClick={handleViewSheet}
                className="border-neutral-200 text-neutral-600 hover:text-neutral-800"
              >
                <i className="fas fa-external-link-alt text-sm"></i>
              </Button>
            </div>
          </>
        ) : isConnected && !hasSpreadsheetId ? (
          <>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <i className="fab fa-google text-amber-500"></i>
              </div>
              <div>
                <p className="font-medium text-neutral-800">Google Connected</p>
                <p className="text-neutral-600 text-sm">Enter your spreadsheet ID to complete setup</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="spreadsheet-id" className="text-sm font-medium text-neutral-700">
                  Google Sheets ID
                </Label>
                <Input
                  id="spreadsheet-id"
                  type="text"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Copy this from your Google Sheets URL: docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSetSpreadsheetId}
              disabled={isSubmitting || !spreadsheetId.trim()}
              className="w-full bg-primary hover:bg-primary-dark text-white"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fas fa-link mr-2"></i>
                  Connect Spreadsheet
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                <i className="fab fa-google text-neutral-600"></i>
              </div>
              <div>
                <p className="font-medium text-neutral-800">Not Connected</p>
                <p className="text-neutral-600 text-sm">Connect to sync your data</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-neutral-600">
                <i className="fas fa-sync text-primary mr-2"></i>
                Auto-sync transactions
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <i className="fas fa-chart-bar text-primary mr-2"></i>
                Real-time budgeting
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <i className="fas fa-mobile-alt text-primary mr-2"></i>
                Access anywhere
              </div>
            </div>

            <Button 
              onClick={onConnect}
              className="w-full bg-primary hover:bg-primary-dark text-white"
            >
              <i className="fab fa-google mr-2"></i>
              Connect Google Sheets
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
