import BardanaTab from "@/components/BardanaTab";
import ChangeLogTab from "@/components/ChangeLogTab";
import InventoryTab from "@/components/InventoryTab";
import LoginPage from "@/components/LoginPage";
import OrdersTab from "@/components/OrdersTab";
import RawMaterialsTab from "@/components/RawMaterialsTab";
import ToolsMachineryTab from "@/components/ToolsMachineryTab";
import UserManagementTab from "@/components/UserManagementTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataStoreProvider, useDataStore } from "@/contexts/DataStoreContext";
import { LayoutGrid, Loader2, LogOut, Package2, Users } from "lucide-react";
import { useState } from "react";

function MainApp() {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const adminTabs = [
    { value: "inventory", label: "Inventory" },
    { value: "bardana", label: "Bardana" },
    { value: "orders", label: "Orders" },
    { value: "tools", label: "Tools & Machinery" },
    { value: "rawmaterials", label: "Raw Materials" },
    { value: "changelog", label: "Change Log" },
    { value: "users", label: "User Management" },
  ];

  const staffTabs = [
    { value: "inventory", label: "Inventory" },
    { value: "bardana", label: "Bardana" },
    { value: "tools", label: "Tools & Machinery" },
    { value: "rawmaterials", label: "Raw Materials" },
  ];

  const visibleTabs = isAdmin ? adminTabs : staffTabs;
  const [activeTab, setActiveTab] = useState(visibleTabs[0].value);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-header text-header-foreground shadow-md border-b border-header-border">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded bg-accent/20 border border-accent/40">
            <Package2 className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide font-display text-header-foreground leading-tight">
              LS Group Inventory Management System
            </h1>
            <p className="text-xs text-header-muted font-medium tracking-wider uppercase">
              Arhar Daal Manufacturing
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <LayoutGrid className="w-4 h-4 text-accent" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-header-foreground capitalize">
                {currentUser?.username}
              </span>
              <Badge
                variant="outline"
                className={
                  isAdmin
                    ? "border-emerald-400 text-emerald-300 bg-emerald-900/30 text-xs"
                    : "border-blue-400 text-blue-300 bg-blue-900/30 text-xs"
                }
              >
                {isAdmin ? "Admin" : "Staff"}
              </Badge>
            </div>
            <Button
              data-ocid="header.secondary_button"
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-header-foreground hover:bg-accent/20 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-card border border-border p-1 rounded-md mb-4 w-full justify-start">
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-ocid={`nav.${tab.value}.tab`}
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold text-sm px-4 py-2"
              >
                {tab.value === "users" && (
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                )}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="inventory" className="mt-0">
            <InventoryTab />
          </TabsContent>
          <TabsContent value="bardana" className="mt-0">
            <BardanaTab />
          </TabsContent>
          <TabsContent value="tools" className="mt-0">
            <ToolsMachineryTab />
          </TabsContent>
          <TabsContent value="rawmaterials" className="mt-0">
            <RawMaterialsTab />
          </TabsContent>
          {isAdmin && (
            <>
              <TabsContent value="orders" className="mt-0">
                <OrdersTab />
              </TabsContent>
              <TabsContent value="changelog" className="mt-0">
                <ChangeLogTab />
              </TabsContent>
              <TabsContent value="users" className="mt-0">
                <UserManagementTab />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} LS Group · Arhar Daal Manufacturing
          </span>
          <span className="flex items-center gap-1">
            Built with <span className="text-red-500">♥</span> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "ls-group-ims")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-accent/20 border border-accent/40">
          <Package2 className="w-8 h-8 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            LS Group Inventory
          </h2>
          <p className="text-sm text-muted-foreground">Loading shared data…</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    </div>
  );
}

function AppGate() {
  const { isLoading } = useDataStore();
  const { currentUser } = useAuth();

  if (isLoading) return <LoadingScreen />;
  return currentUser ? <MainApp /> : <LoginPage />;
}

export default function App() {
  return (
    <DataStoreProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </DataStoreProvider>
  );
}
