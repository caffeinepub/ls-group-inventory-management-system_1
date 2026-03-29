import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  PLANTS,
  RAW_MATERIAL_PRODUCTS,
  branchBadgeClass,
  branchTabClass,
  sortProducts,
  useRawMaterialsStore,
} from "@/hooks/useInventoryStore";
import {
  ArrowDown,
  ArrowUp,
  Check,
  FlaskConical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

function ConsolidatedRawMaterials() {
  const { getAllProducts } = useRawMaterialsStore();
  const pulseProducts = getAllProducts("LS Pulses");
  const foodsProducts = getAllProducts("LS Foods LLP");

  const nameSet = new Set<string>();
  for (const p of pulseProducts) nameSet.add(p.name);
  for (const p of foodsProducts) nameSet.add(p.name);

  const merged = Array.from(nameSet).map((name) => {
    const pulseQty = pulseProducts.find((p) => p.name === name)?.quantity ?? 0;
    const foodsQty = foodsProducts.find((p) => p.name === name)?.quantity ?? 0;
    return { name, quantity: pulseQty + foodsQty };
  });

  const sorted = sortProducts(merged, RAW_MATERIAL_PRODUCTS);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50 border-b border-border">
              <th className="text-left px-4 py-2.5 font-semibold text-foreground w-8">
                #
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Product
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-48">
                Consolidated Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, idx) => (
              <tr
                key={product.name}
                data-ocid={`rawmat.item.${idx + 1}`}
                className="border-b border-border hover:bg-purple-50/30 transition-colors"
              >
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {idx + 1}
                </td>
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {product.name}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <Badge
                    variant={product.quantity > 0 ? "default" : "secondary"}
                    className={
                      product.quantity > 0
                        ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold text-sm px-3"
                        : "font-bold text-sm px-3"
                    }
                  >
                    {product.quantity % 1 === 0
                      ? product.quantity.toFixed(0)
                      : product.quantity}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-border bg-purple-50/40">
        <p className="text-xs text-purple-700 font-medium">
          Consolidated values = LS Pulses + LS Foods LLP
        </p>
      </div>
    </>
  );
}

function PlantRawMaterials({ plantKey }: { plantKey: string }) {
  const {
    getOrderedProducts,
    setStock,
    addProduct,
    deleteProduct,
    reorderProduct,
  } = useRawMaterialsStore();
  const { currentUser } = useAuth();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === "admin";

  const products = getOrderedProducts(plantKey);

  const startEdit = (productName: string, currentQty: number) => {
    setEditingProduct(productName);
    setEditValue(String(currentQty));
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditValue("");
  };

  const saveEdit = (productName: string) => {
    const qty = Number.parseFloat(editValue);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Value must be a non-negative number");
      return;
    }

    setStock(plantKey, productName, qty);
    toast.success(`Updated ${productName} to ${qty}`);
    setEditingProduct(null);
    setEditValue("");
  };

  const handleShowAddRow = () => {
    setShowAddRow(true);
    setNewProductName("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAddProduct = () => {
    const trimmed = newProductName.trim();
    if (!trimmed) {
      toast.error("Product name cannot be empty");
      return;
    }
    const success = addProduct(plantKey, trimmed);
    if (success) {
      toast.success(`"${trimmed}" added to raw materials`);
      setShowAddRow(false);
      setNewProductName("");
    } else {
      toast.error(`"${trimmed}" already exists in this plant's raw materials`);
    }
  };

  const handleCancelAdd = () => {
    setShowAddRow(false);
    setNewProductName("");
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteProduct(plantKey, deleteConfirm);
    toast.success(`"${deleteConfirm}" removed from raw materials`);
    setDeleteConfirm(null);
  };

  const colSpan = isAdmin ? 7 : 6;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-4 py-2.5 font-semibold text-foreground w-8">
                #
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Product
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">
                Current Stock
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-56">
                Edit Stock
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-32">
                Action
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-20">
                Order
              </th>
              {isAdmin && (
                <th className="text-center px-4 py-2.5 font-semibold text-foreground w-20">
                  Delete
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr
                key={product.name}
                data-ocid={`rawmat.item.${idx + 1}`}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-2.5 text-muted-foreground text-xs">
                  {idx + 1}
                </td>
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {product.name}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <Badge
                    variant={product.quantity > 0 ? "default" : "secondary"}
                    className={
                      product.quantity > 0
                        ? "bg-purple-100 text-purple-800 border-purple-200 font-bold text-sm px-3"
                        : "font-bold text-sm px-3"
                    }
                  >
                    {product.quantity % 1 === 0
                      ? product.quantity.toFixed(0)
                      : product.quantity}
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
                      data-ocid="rawmat.input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(product.name);
                        if (e.key === "Escape") cancelEdit();
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
                        data-ocid={`rawmat.save_button.${idx + 1}`}
                        onClick={() => saveEdit(product.name)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                        data-ocid={`rawmat.cancel_button.${idx + 1}`}
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
                      data-ocid={`rawmat.edit_button.${idx + 1}`}
                      onClick={() => startEdit(product.name, product.quantity)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() =>
                        reorderProduct(plantKey, product.name, "up")
                      }
                      className="inline-flex items-center justify-center w-7 h-7 rounded
                        bg-muted text-muted-foreground border border-border
                        hover:bg-accent hover:text-accent-foreground
                        disabled:opacity-30 disabled:cursor-not-allowed
                        transition-all duration-150 cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === products.length - 1}
                      onClick={() =>
                        reorderProduct(plantKey, product.name, "down")
                      }
                      className="inline-flex items-center justify-center w-7 h-7 rounded
                        bg-muted text-muted-foreground border border-border
                        hover:bg-accent hover:text-accent-foreground
                        disabled:opacity-30 disabled:cursor-not-allowed
                        transition-all duration-150 cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(product.name)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md
                        bg-red-50 text-red-600 border border-red-200
                        hover:bg-red-100 hover:border-red-400
                        transition-all duration-150 cursor-pointer"
                      title={`Delete ${product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {showAddRow && isAdmin && (
              <tr className="border-b border-border bg-muted/10">
                <td colSpan={colSpan} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Enter product name"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="h-8 text-sm max-w-xs"
                      data-ocid="rawmat.input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddProduct();
                        if (e.key === "Escape") handleCancelAdd();
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                      data-ocid="rawmat.submit_button"
                      onClick={handleAddProduct}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      data-ocid="rawmat.cancel_button"
                      onClick={handleCancelAdd}
                    >
                      Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && !showAddRow && (
        <div className="px-4 py-3 border-t border-border">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs gap-1.5 text-purple-700 border-purple-400 hover:bg-purple-50"
            data-ocid="rawmat.open_modal_button"
            onClick={handleShowAddRow}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </Button>
        </div>
      )}

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteConfirm}"</strong>{" "}
              from raw materials? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function RawMaterialsTab() {
  const [activePlant, setActivePlant] = useState("ls-pulses");

  const isConsolidated = activePlant === "consolidated";
  const currentPlant = isConsolidated
    ? "Consolidated"
    : (PLANTS.find(
        (p) => p.toLowerCase().replace(/\s+/g, "-") === activePlant,
      ) ?? PLANTS[0]);

  const headerBadgeClass = isConsolidated
    ? "bg-purple-100 text-purple-800 border border-purple-400 font-semibold"
    : branchBadgeClass(currentPlant);

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <FlaskConical className="w-5 h-5 text-accent" />
            Raw Materials
          </CardTitle>
          <span
            className={`text-xs px-3 py-1 rounded-full ${headerBadgeClass}`}
          >
            {currentPlant}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs
          value={activePlant}
          onValueChange={setActivePlant}
          className="w-full"
        >
          <div className="px-4 pt-4">
            <TabsList className="bg-muted border border-border">
              {PLANTS.map((plant) => (
                <TabsTrigger
                  key={plant}
                  value={plant.toLowerCase().replace(/\s+/g, "-")}
                  data-ocid="rawmat.tab"
                  className={`font-semibold ${branchTabClass(plant)}`}
                >
                  {plant}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="consolidated"
                data-ocid="rawmat.tab"
                className="font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:text-purple-700"
              >
                Consolidated
              </TabsTrigger>
            </TabsList>
          </div>
          {PLANTS.map((plant) => (
            <TabsContent
              key={plant}
              value={plant.toLowerCase().replace(/\s+/g, "-")}
              className="mt-0 pt-3"
            >
              <PlantRawMaterials plantKey={plant} />
            </TabsContent>
          ))}
          <TabsContent value="consolidated" className="mt-0 pt-3">
            <ConsolidatedRawMaterials />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
