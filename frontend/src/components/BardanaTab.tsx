import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, PackageOpen, Pencil, Check, X } from 'lucide-react';
import { useGetBardana, useSetBardanaStock } from '@/hooks/useQueries';
import { sortProducts } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProductView } from '../backend';

const PLANTS = ['LS Pulses', 'LS Foods LLP'] as const;

const BARDANA_PRODUCTS_ORDER = [
  'Indica', 'Ghadi Green', 'Ghadi Red', 'Tiranga', 'L.S.',
  'Bahubali', 'Kasturi', 'Uttam', 'Gajraj', 'Plain 50kg bags', 'Golden Tiger',
];

function PlantBardana({ plant, products }: { plant: string; products: ProductView[] }) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const setStock = useSetBardanaStock();

  const sorted = sortProducts(products, BARDANA_PRODUCTS_ORDER);

  const startEdit = (product: ProductView) => {
    setEditingProduct(product.name);
    setEditValue(String(product.quantity));
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditValue('');
  };

  const saveEdit = async (productName: string) => {
    const qty = parseFloat(editValue);
    if (isNaN(qty) || qty < 0) {
      toast.error('Value must be a non-negative number');
      return;
    }
    try {
      await setStock.mutateAsync({ plant, productName, quantity: qty });
      setEditingProduct(null);
      setEditValue('');
      toast.success(`Updated ${productName} stock to ${qty}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update stock';
      toast.error(message);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            <th className="text-left px-4 py-2.5 font-semibold text-foreground w-8">#</th>
            <th className="text-left px-4 py-2.5 font-semibold text-foreground">Product</th>
            <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">Current Stock</th>
            <th className="text-center px-4 py-2.5 font-semibold text-foreground w-56">Edit Stock</th>
            <th className="text-center px-4 py-2.5 font-semibold text-foreground w-32">Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((product, idx) => (
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
                      ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold text-sm px-3'
                      : 'font-bold text-sm px-3'
                  }
                >
                  {product.quantity % 1 === 0 ? product.quantity.toFixed(0) : product.quantity}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-center">
                {editingProduct === product.name ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-32 mx-auto text-center h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(product.name);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-center">
                {editingProduct === product.name ? (
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50"
                      onClick={() => saveEdit(product.name)}
                      disabled={setStock.isPending}
                    >
                      {setStock.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                      onClick={cancelEdit}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs"
                    onClick={() => startEdit(product)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BardanaTab() {
  const { data: bardanaData, isLoading } = useGetBardana();

  const getPlantProducts = (plant: string): ProductView[] => {
    if (!bardanaData) return BARDANA_PRODUCTS_ORDER.map((name) => ({ name, quantity: 0 }));
    const entry = bardanaData.find(([key]) => key === plant);
    if (!entry) return BARDANA_PRODUCTS_ORDER.map((name) => ({ name, quantity: 0 }));
    const productMap = new Map(entry[1].products.map((p) => [p.name, p]));
    return BARDANA_PRODUCTS_ORDER.map((name) => productMap.get(name) ?? { name, quantity: 0 });
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <PackageOpen className="w-5 h-5 text-accent" />
          Bardana Stock Management
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
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
                <PlantBardana plant={plant} products={getPlantProducts(plant)} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
