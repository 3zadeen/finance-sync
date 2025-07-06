import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsGrid from "@/components/StatsGrid";
import TransactionList from "@/components/TransactionList";
import UploadCard from "@/components/UploadCard";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import GoogleSheetsCard from "@/components/GoogleSheetsCard";
import TransactionModal from "@/components/TransactionModal";
import UploadProgressModal from "@/components/UploadProgressModal";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { data: googleSheetsStatus } = useQuery({
    queryKey: ["/api/google-sheets-status"],
  });

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleUploadStart = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
  };

  const handleConnectGoogleSheets = async () => {
    try {
      const response = await fetch("/api/google-auth-url");
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get Google auth URL:", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold text-neutral-800">FinanceFlow</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <button className="text-neutral-600 hover:text-neutral-800 transition-colors">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
                <span className="text-sm font-medium text-neutral-700">John Smith</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">Financial Dashboard</h2>
              <p className="text-neutral-600 mt-1">Upload, categorize, and sync your financial data seamlessly</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Google Sheets Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                googleSheetsStatus?.connected 
                  ? "bg-success bg-opacity-10" 
                  : "bg-neutral-200"
              }`}>
                <i className={`fab fa-google text-sm ${
                  googleSheetsStatus?.connected ? "text-success" : "text-neutral-600"
                }`}></i>
                <span className={`text-sm font-medium ${
                  googleSheetsStatus?.connected ? "text-success" : "text-neutral-600"
                }`}>
                  {googleSheetsStatus?.connected ? "Sheets Connected" : "Not Connected"}
                </span>
              </div>
              <Button onClick={handleUploadStart} className="bg-primary hover:bg-primary-dark text-white">
                <i className="fas fa-upload mr-2"></i>
                Upload Statement
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Transactions List */}
          <div className="lg:col-span-2">
            <TransactionList onEditTransaction={handleEditTransaction} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UploadCard onUploadStart={handleUploadStart} />
            <CategoryBreakdown />
            <GoogleSheetsCard 
              isConnected={googleSheetsStatus?.connected || false}
              hasSpreadsheetId={!!(googleSheetsStatus?.connected && googleSheetsStatus?.spreadsheetId)}
              onConnect={handleConnectGoogleSheets}
            />
          </div>
          
        </div>
      </div>

      {/* Modals */}
      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transaction={selectedTransaction}
      />
      
      <UploadProgressModal 
        isOpen={isUploadModalOpen}
        onClose={handleUploadComplete}
      />
    </div>
  );
}
