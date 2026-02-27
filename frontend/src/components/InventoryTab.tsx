import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Loader2, Factory } from 'lucide-react';
import { useGetInventory, useAddInventoryStock, useRemoveInventoryStock } from '@/hooks/useQueries';
import { sortProducts } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProductView } from '../backend';

// Display names for the sub-tabs (order matters for positional fallback)
const PLANTS = ['LS Pulses', 'LS Foods LLP'] as const;

const INVENTORY_PRODUCTS_ORDER = [
  'Indica', 'Ghadi Green', 'Ghadi Red', 'Tiranga Kutta', 'Tiranga Jarda',
  'L.S.', 'Bahubali', 'Kasturi', 'Uttam', 'Gajraj',
  'Khanda Rejection', 'Kachari', 'Kooda', 'Akra', 'Golden Tiger',
];

const CURRENT_USER = 'admin';

/** Normalize a string for fuzzy matching: lowercase, remove spaces and non-alphanumeric chars */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function PlantInventory({
  plantKey,
  plantLabel,
  products,
}: {
  plantKey: string;
  plantLabel: string;
  products: ProductView[];
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const addStock = useAddInventoryStock();
  const removeStock = useRemoveInventoryStock();

  const sorted = sortProducts(products, INVENTORY_PRODUCTS_ORDER);

  const handleAdd = async (productName: string) => {
    const raw = quantities[productName] ?? '';
    const qty = parseInt(raw, 10);
    if (!raw || isNaN(qty) || qty <= 0) {
      toast.error('Enter a valid positive integer quantity');
      return;
    }
    try {
      await addStock.mutateAsync({
        plant: plantKey,
        productName,
        quantity: BigInt(qty),
        user: CURRENT_USER,
      });
      setQuantities((prev) => ({ ...prev, [productName]: '' }));
      toast.success(`Added ${qty} to ${productName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add stock';
      toast.error(message);
    }
  };

  const handleRemove = async (productName: string) => {
    const raw = quantities[productName] ?? '';
    const qty = parseInt(raw, 10);
    if (!raw || isNaN(qty) || qty <= 0) {
      toast.error('Enter a valid positive integer quantity');
      return;
    }
    try {
      await removeStock.mutateAsync({
        plant: plantKey,
        productName,
        quantity: BigInt(qty),
        user: CURRENT_USER,
      });
      setQuantities((prev) => ({ ...prev, [productName]: '' }));
      toast.success(`Removed ${qty} from ${productName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove stock';
      toast.error(message);
    }
  };

  // Track pending state per product to avoid disabling unrelated rows
  const isAddPending = addStock.isPending;
  const isRemovePending = removeStock.isPending;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            <th className="text-left px-4 py-2.5 font-semibold text-foreground w-8">#</th>
            <th className="text-left px-4 py-2.5 font-semibold text-foreground">Product</th>
            <th className="text-center px-4 py-2.5 font-semibold text-foreground w-32">Current Stock</th>
            <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">Quantity</th>
            <th className="text-center px-4 py-2.5 font-semibold text-foreground w-48">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((product, idx) => {
            const isBusy = isAddPending || isRemovePending;
            return (
              <tr
                key={product.name}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{product.name}</td>
                <td className="px-4 py-2.5 text-center">
                  <Badge
                    variant={product.quantity > 0 ? 'default' : 'secondary'}
                    className={
                      product.quantity > 0
                        ? 'bg-green-100 text-green-800 border-green-200 font-bold text-sm px-3'
                        : 'font-bold text-sm px-3'
                    }
                  >
                    {product.quantity}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Qty"
                    value={quantities[product.name] ?? ''}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [product.name]: e.target.value }))
                    }
                    className="w-24 mx-auto text-center h-8 text-sm"
                    disabled={isBusy}
                  />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 border-green-400 text-green-700 hover:bg-green-50 hover:text-green-800"
                      onClick={() => handleAdd(product.name)}
                      disabled={isBusy}
                    >
                      {isAddPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      <span className="ml-1">Add</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 border-red-400 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => handleRemove(product.name)}
                      disabled={isBusy || product.quantity === 0}
                    >
                      {isRemovePending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span className="ml-1">Sub</span>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function InventoryTab() {
  const { data: inventoryData, isLoading } = useGetInventory();

  /**
   * Resolve the actual backend map key for a given plant display name.
   * Tries (in order):
   *   1. Exact match
   *   2. Case-insensitive match
   *   3. Normalized match (strip spaces/punctuation, lowercase)
   *   4. Positional fallback — use the nth backend key for the nth PLANTS entry
   *      (handles cases where backend keys are completely different strings)
   */
  const getPlantKey = (plantLabel: string): string => {
    if (!inventoryData || inventoryData.length === 0) return plantLabel;

    // 1. Exact match
    const exactMatch = inventoryData.find(([key]) => key === plantLabel);
    if (exactMatch) return exactMatch[0];

    // 2. Case-insensitive match
    const lowerLabel = plantLabel.toLowerCase();
    const caseMatch = inventoryData.find(([key]) => key.toLowerCase() === lowerLabel);
    if (caseMatch) return caseMatch[0];

    // 3. Normalized match (remove spaces, punctuation, lowercase)
    const normLabel = normalizeKey(plantLabel);
    const normMatch = inventoryData.find(([key]) => normalizeKey(key) === normLabel);
    if (normMatch) return normMatch[0];

    // 4. Positional fallback: map PLANTS index → sorted backend keys index
    const plantIndex = PLANTS.indexOf(plantLabel as typeof PLANTS[number]);
    if (plantIndex >= 0 && plantIndex < inventoryData.length) {
      // Sort keys so the mapping is deterministic
      const sortedKeys = [...inventoryData].sort(([a], [b]) => a.localeCompare(b));
      return sortedKeys[plantIndex][0];
    }

    // Last resort: return the display name itself
    return plantLabel;
  };

  const getPlantProducts = (plantLabel: string): ProductView[] => {
    if (!inventoryData) return INVENTORY_PRODUCTS_ORDER.map((name) => ({ name, quantity: 0 }));
    const plantKey = getPlantKey(plantLabel);
    const entry = inventoryData.find(([key]) => key === plantKey);
    if (!entry) return INVENTORY_PRODUCTS_ORDER.map((name) => ({ name, quantity: 0 }));
    // Ensure all canonical products are present, filling zeros for missing ones
    const productMap = new Map(entry[1].products.map((p) => [p.name, p]));
    return INVENTORY_PRODUCTS_ORDER.map((name) => productMap.get(name) ?? { name, quantity: 0 });
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Factory className="w-5 h-5 text-accent" />
          Inventory Management
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="ls-pulses" className="w-full">
            <div className="px-4 pt-4">
              <TabsList className="bg-muted border border-border">
                {PLANTS.map((plant) => (
                  <TabsTrigger
                    key={plant}
                    value={plant.toLowerCase().replace(/\s+/g, '-')}
                    className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold"
                  >
                    {plant}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {PLANTS.map((plant) => (
              <TabsContent
                key={plant}
                value={plant.toLowerCase().replace(/\s+/g, '-')}
                className="mt-0 pt-3"
              >
                <PlantInventory
                  plantKey={getPlantKey(plant)}
                  plantLabel={plant}
                  products={getPlantProducts(plant)}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
