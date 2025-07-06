import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface GoogleSheetsCardProps {
  isConnected: boolean;
  onConnect: () => void;
}

export default function GoogleSheetsCard({ isConnected, onConnect }: GoogleSheetsCardProps) {
  const { toast } = useToast();

  const handleSyncNow = async () => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "Please connect to Google Sheets first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/sync-google-sheets', {
        method: 'POST',
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
        
        {isConnected ? (
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
