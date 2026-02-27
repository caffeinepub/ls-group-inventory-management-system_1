import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InventoryTab from '@/components/InventoryTab';
import BardanaTab from '@/components/BardanaTab';
import OrdersTab from '@/components/OrdersTab';
import ToolsMachineryTab from '@/components/ToolsMachineryTab';
import RawMaterialsTab from '@/components/RawMaterialsTab';
import ChangeLogTab from '@/components/ChangeLogTab';
import { Toaster } from '@/components/ui/sonner';
import { Package2, LayoutGrid } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');

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
              Arhar Daal Manufacturing · Full Admin Access
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">Admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-card border border-border p-1 rounded-md mb-4 w-full justify-start">
            <TabsTrigger value="inventory" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold text-sm px-4 py-2">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="bardana" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold text-sm px-4 py-2">
              Bardana
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold text-sm px-4 py-2">
              Orders
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold text-sm px-4 py-2">
              Tools &amp; Machinery
            </TabsTrigger>
            <TabsTrigger value="rawmaterials" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold text-sm px-4 py-2">
              Raw Materials
            </TabsTrigger>
            <TabsTrigger value="changelog" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold text-sm px-4 py-2">
              Change Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-0">
            <InventoryTab />
          </TabsContent>
          <TabsContent value="bardana" className="mt-0">
            <BardanaTab />
          </TabsContent>
          <TabsContent value="orders" className="mt-0">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="tools" className="mt-0">
            <ToolsMachineryTab />
          </TabsContent>
          <TabsContent value="rawmaterials" className="mt-0">
            <RawMaterialsTab />
          </TabsContent>
          <TabsContent value="changelog" className="mt-0">
            <ChangeLogTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} LS Group · Arhar Daal Manufacturing</span>
          <span className="flex items-center gap-1">
            Built with <span className="text-red-500">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'ls-group-ims')}`}
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
