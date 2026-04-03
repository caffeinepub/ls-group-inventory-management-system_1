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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  INVENTORY_PRODUCTS,
  PLANTS,
  branchBadgeClass,
  branchTabClass,
  sortProducts,
  useInventoryStore,
} from "@/hooks/useInventoryStore";
import { useTransactionLog } from "@/hooks/useTransactionLog";
import {
  Factory,
  LayoutList,
  Plus,
  Share2,
  ShoppingBag,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import InventoryStockDialog from "./InventoryStockDialog";

interface DialogState {
  productName: string;
  currentStock: number;
  plantKey: string;
}

interface ShareCategories {
  lsPulses: boolean;
  lsFoods: boolean;
  consolidated: boolean;
}

function ConsolidatedInventory() {
  const { getAllProducts } = useInventoryStore();
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

  const sorted = sortProducts(merged, INVENTORY_PRODUCTS);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50 border-b border-border">
              <th className="text-left px-4 py-2.5 font-semibold text-foreground w-10">
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
                data-ocid={`inventory.item.${idx + 1}`}
                className="border-b border-border hover:bg-purple-50/30 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {idx + 1}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center min-w-[3.5rem] px-4 py-1.5 rounded-full font-bold text-base tabular-nums ${product.quantity > 0 ? "bg-purple-100 text-purple-800 border border-purple-300" : "bg-muted text-muted-foreground border border-border"}`}
                  >
                    {product.quantity}
                  </span>
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

function PlantInventory({ plantKey }: { plantKey: string }) {
  const { getAllProducts, setStock, addProduct, deleteProduct } =
    useInventoryStore();
  const { currentUser } = useAuth();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === "admin";
  const products = getAllProducts(plantKey);
  const sorted = sortProducts(products, INVENTORY_PRODUCTS);

  const openDialog = (productName: string, currentStock: number) => {
    setDialogState({ productName, currentStock, plantKey });
  };

  const handleSave = (productName: string, newQty: number) => {
    setStock(plantKey, productName, newQty);
    setDialogState(null);
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
      toast.success(`"${trimmed}" added to inventory`);
      setShowAddRow(false);
      setNewProductName("");
    } else {
      toast.error(`"${trimmed}" already exists in this plant's inventory`);
    }
  };

  const handleCancelAdd = () => {
    setShowAddRow(false);
    setNewProductName("");
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteProduct(plantKey, deleteConfirm);
    toast.success(`"${deleteConfirm}" removed from inventory`);
    setDeleteConfirm(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-4 py-2.5 font-semibold text-foreground w-10">
                #
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Product
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-48">
                Current Stock
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-24">
                Update
              </th>
              {isAdmin && (
                <th className="text-center px-4 py-2.5 font-semibold text-foreground w-20">
                  Delete
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, idx) => (
              <tr
                key={product.name}
                data-ocid={`inventory.item.${idx + 1}`}
                className="border-b border-border hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {idx + 1}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center min-w-[3.5rem] px-4 py-1.5 rounded-full font-bold text-base tabular-nums ${product.quantity > 0 ? "bg-green-100 text-green-800 border border-green-300" : "bg-muted text-muted-foreground border border-border"}`}
                  >
                    {product.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    data-ocid={`inventory.open_modal_button.${idx + 1}`}
                    onClick={() => openDialog(product.name, product.quantity)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 hover:border-accent/50 transition-all duration-150 cursor-pointer"
                    title={`Update stock for ${product.name}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(product.name)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-400 transition-all duration-150 cursor-pointer"
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
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Enter product name"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="h-8 text-sm max-w-xs"
                      data-ocid="inventory.input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddProduct();
                        if (e.key === "Escape") handleCancelAdd();
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                      data-ocid="inventory.submit_button"
                      onClick={handleAddProduct}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      data-ocid="inventory.cancel_button"
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
            className="h-8 px-3 text-xs gap-1.5 text-green-700 border-green-400 hover:bg-green-50"
            data-ocid="inventory.open_modal_button"
            onClick={handleShowAddRow}
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Button>
        </div>
      )}

      {dialogState && (
        <InventoryStockDialog
          open={!!dialogState}
          onOpenChange={(open) => {
            if (!open) setDialogState(null);
          }}
          productName={dialogState.productName}
          currentStock={dialogState.currentStock}
          plantKey={dialogState.plantKey}
          onSave={handleSave}
        />
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
              from the inventory? This action cannot be undone.
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

function FilledSoldView({
  plant,
  mode,
}: { plant: string; mode: "filled" | "sold" }) {
  const { getTodaySummary } = useTransactionLog();
  const type = mode === "filled" ? "add" : "subtract";
  const items = getTodaySummary(plant, type).filter((p) => p.quantity > 0);
  const label = mode === "filled" ? "filling" : "selling";
  const colorClass = mode === "filled" ? "text-blue-700" : "text-red-700";
  const bgClass = mode === "filled" ? "bg-blue-50" : "bg-red-50";
  const borderClass = mode === "filled" ? "border-blue-200" : "border-red-200";
  const headingBg =
    mode === "filled" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800";

  return (
    <div
      className={`mx-4 mb-4 rounded-lg border ${borderClass} ${bgClass} overflow-hidden`}
    >
      <div
        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${headingBg}`}
      >
        Today's {mode === "filled" ? "Filling" : "Selling"} — {plant}
      </div>
      {items.length === 0 ? (
        <div
          className={`px-4 py-6 text-center text-sm ${colorClass} opacity-60`}
        >
          No {label} recorded today
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${borderClass}`}>
                <th
                  className={`px-4 py-2 text-left font-semibold text-xs uppercase ${colorClass}`}
                >
                  Product
                </th>
                <th
                  className={`px-4 py-2 text-right font-semibold text-xs uppercase ${colorClass}`}
                >
                  Bags
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.name}
                  className={idx % 2 === 0 ? "bg-white/60" : ""}
                >
                  <td className="px-4 py-2 font-medium text-foreground">
                    {item.name}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-bold ${colorClass}`}
                  >
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ConsolidatedFilledSoldView({ mode }: { mode: "filled" | "sold" }) {
  const { getTodaySummary } = useTransactionLog();
  const type = mode === "filled" ? "add" : "subtract";
  const label = mode === "filled" ? "filling" : "selling";
  const colorClass = mode === "filled" ? "text-blue-700" : "text-red-700";
  const bgClass = mode === "filled" ? "bg-blue-50" : "bg-red-50";
  const borderClass = mode === "filled" ? "border-blue-200" : "border-red-200";
  const headingBg =
    mode === "filled" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800";

  const pulseItems = getTodaySummary("LS Pulses", type);
  const foodsItems = getTodaySummary("LS Foods LLP", type);

  const nameSet = new Set<string>();
  for (const p of pulseItems) nameSet.add(p.name);
  for (const p of foodsItems) nameSet.add(p.name);

  const combined = Array.from(nameSet)
    .map((name) => ({
      name,
      quantity:
        (pulseItems.find((p) => p.name === name)?.quantity ?? 0) +
        (foodsItems.find((p) => p.name === name)?.quantity ?? 0),
    }))
    .filter((p) => p.quantity > 0);

  return (
    <div
      className={`mx-4 mb-4 rounded-lg border ${borderClass} ${bgClass} overflow-hidden`}
    >
      <div
        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${headingBg}`}
      >
        Today's {mode === "filled" ? "Filling" : "Selling"} — Consolidated
      </div>
      {combined.length === 0 ? (
        <div
          className={`px-4 py-6 text-center text-sm ${colorClass} opacity-60`}
        >
          No {label} recorded today
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${borderClass}`}>
                <th
                  className={`px-4 py-2 text-left font-semibold text-xs uppercase ${colorClass}`}
                >
                  Product
                </th>
                <th
                  className={`px-4 py-2 text-right font-semibold text-xs uppercase ${colorClass}`}
                >
                  Bags
                </th>
              </tr>
            </thead>
            <tbody>
              {combined.map((item, idx) => (
                <tr
                  key={item.name}
                  className={idx % 2 === 0 ? "bg-white/60" : ""}
                >
                  <td className="px-4 py-2 font-medium text-foreground">
                    {item.name}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-bold ${colorClass}`}
                  >
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InventoryTab() {
  const [activePlant, setActivePlant] = useState("ls-pulses");
  const [viewMode, setViewMode] = useState<"inventory" | "filled" | "sold">(
    "inventory",
  );
  const { getAllProducts } = useInventoryStore();
  const { getTodaySummary } = useTransactionLog();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ShareCategories>(
    {
      lsPulses: true,
      lsFoods: true,
      consolidated: true,
    },
  );

  const isConsolidated = activePlant === "consolidated";
  const currentPlant = isConsolidated
    ? "Consolidated"
    : (PLANTS.find(
        (p) => p.toLowerCase().replace(/\s+/g, "-") === activePlant,
      ) ?? PLANTS[0]);

  const headerBadgeClass = isConsolidated
    ? "bg-purple-100 text-purple-800 border border-purple-400 font-semibold"
    : branchBadgeClass(currentPlant);

  const allSelected =
    selectedCategories.lsPulses &&
    selectedCategories.lsFoods &&
    selectedCategories.consolidated;

  const noneSelected =
    !selectedCategories.lsPulses &&
    !selectedCategories.lsFoods &&
    !selectedCategories.consolidated;

  const handleAllToggle = (checked: boolean) => {
    setSelectedCategories({
      lsPulses: checked,
      lsFoods: checked,
      consolidated: checked,
    });
  };

  const handleCategoryToggle = (
    key: keyof ShareCategories,
    checked: boolean,
  ) => {
    setSelectedCategories((prev) => ({ ...prev, [key]: checked }));
  };

  const handleShareConfirm = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const pulseProducts = sortProducts(
      getAllProducts("LS Pulses"),
      INVENTORY_PRODUCTS,
    ).filter((p) => p.quantity > 0);
    const foodsProducts = sortProducts(
      getAllProducts("LS Foods LLP"),
      INVENTORY_PRODUCTS,
    ).filter((p) => p.quantity > 0);

    const nameSet = new Set<string>();
    for (const p of pulseProducts) nameSet.add(p.name);
    for (const p of foodsProducts) nameSet.add(p.name);
    const consolidated = sortProducts(
      Array.from(nameSet).map((name) => ({
        name,
        quantity:
          (pulseProducts.find((p) => p.name === name)?.quantity ?? 0) +
          (foodsProducts.find((p) => p.name === name)?.quantity ?? 0),
      })),
      INVENTORY_PRODUCTS,
    ).filter((p) => p.quantity > 0);

    const formatProductList = (
      products: { name: string; quantity: number }[],
    ) => products.map((p) => `${p.name}: ${p.quantity}`).join("\n");

    const sections: string[] = [
      "\uD83D\uDCE6 LS Group Inventory Report",
      `Date: ${dateStr}`,
      "",
    ];

    const addedSections: string[] = [];

    if (selectedCategories.lsPulses) {
      const filling = getTodaySummary("LS Pulses", "add").filter(
        (p) => p.quantity > 0,
      );
      const selling = getTodaySummary("LS Pulses", "subtract").filter(
        (p) => p.quantity > 0,
      );
      let block = "--- LS Pulses ---";
      if (filling.length > 0) {
        block += `\nToday's Filling-\n${formatProductList(filling)}`;
      }
      if (selling.length > 0) {
        block += `\nToday's Selling-\n${formatProductList(selling)}`;
      }
      if (pulseProducts.length > 0) {
        block += `\nCurrent Inventory\n${formatProductList(pulseProducts)}`;
      } else {
        block += "\nNo entries";
      }
      addedSections.push(block);
    }

    if (selectedCategories.lsFoods) {
      const filling = getTodaySummary("LS Foods LLP", "add").filter(
        (p) => p.quantity > 0,
      );
      const selling = getTodaySummary("LS Foods LLP", "subtract").filter(
        (p) => p.quantity > 0,
      );
      let block = "--- LS Foods LLP ---";
      if (filling.length > 0) {
        block += `\nToday's Filling-\n${formatProductList(filling)}`;
      }
      if (selling.length > 0) {
        block += `\nToday's Selling-\n${formatProductList(selling)}`;
      }
      if (foodsProducts.length > 0) {
        block += `\nCurrent Inventory\n${formatProductList(foodsProducts)}`;
      } else {
        block += "\nNo entries";
      }
      addedSections.push(block);
    }

    if (selectedCategories.consolidated) {
      if (consolidated.length > 0) {
        addedSections.push(
          `--- Consolidated ---\n${formatProductList(consolidated)}`,
        );
      } else {
        addedSections.push("--- Consolidated ---\nNo entries");
      }
    }

    sections.push(addedSections.join("\n\n"));

    const report = sections.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
    setShowShareDialog(false);
  };

  return (
    <>
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Factory className="w-5 h-5 text-accent" />
              Inventory Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                data-ocid="inventory.secondary_button"
                className="h-7 px-3 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
              <span
                className={`text-xs px-3 py-1 rounded-full ${headerBadgeClass}`}
              >
                {currentPlant}
              </span>
            </div>
          </div>
          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 mt-2">
            <button
              type="button"
              data-ocid="inventory.tab"
              onClick={() => setViewMode("inventory")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                viewMode === "inventory"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-transparent text-green-700 border-green-400 hover:bg-green-50"
              }`}
            >
              <LayoutList className="w-3 h-3" />
              Inventory
            </button>
            <button
              type="button"
              data-ocid="inventory.tab"
              onClick={() => setViewMode("filled")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                viewMode === "filled"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-transparent text-blue-700 border-blue-400 hover:bg-blue-50"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Filled
            </button>
            <button
              type="button"
              data-ocid="inventory.tab"
              onClick={() => setViewMode("sold")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                viewMode === "sold"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-transparent text-red-700 border-red-400 hover:bg-red-50"
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              Sold
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={activePlant}
            onValueChange={(val) => {
              setActivePlant(val);
              setViewMode("inventory");
            }}
            className="w-full"
          >
            <div className="px-4 pt-4">
              <TabsList className="bg-muted border border-border">
                {PLANTS.map((plant) => (
                  <TabsTrigger
                    key={plant}
                    value={plant.toLowerCase().replace(/\s+/g, "-")}
                    data-ocid="inventory.tab"
                    className={`font-semibold ${branchTabClass(plant)}`}
                  >
                    {plant}
                  </TabsTrigger>
                ))}
                <TabsTrigger
                  value="consolidated"
                  data-ocid="inventory.tab"
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
                {viewMode === "inventory" ? (
                  <PlantInventory plantKey={plant} />
                ) : (
                  <FilledSoldView plant={plant} mode={viewMode} />
                )}
              </TabsContent>
            ))}
            <TabsContent value="consolidated" className="mt-0 pt-3">
              {viewMode === "inventory" ? (
                <ConsolidatedInventory />
              ) : (
                <ConsolidatedFilledSoldView mode={viewMode} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Share Category Selection Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-sm" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-green-600" />
              Select Categories to Share
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose which sections to include in the report:
            </p>

            {/* All */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
              <Checkbox
                id="cat-all"
                data-ocid="inventory.checkbox"
                checked={allSelected}
                onCheckedChange={(checked) => handleAllToggle(!!checked)}
              />
              <Label
                htmlFor="cat-all"
                className="font-semibold text-sm cursor-pointer select-none"
              >
                All Categories
              </Label>
            </div>

            <div className="pl-2 space-y-2">
              {/* LS Pulses */}
              <div className="flex items-center gap-3 p-2.5 rounded-md border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors">
                <Checkbox
                  id="cat-ls-pulses"
                  data-ocid="inventory.checkbox"
                  checked={selectedCategories.lsPulses}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle("lsPulses", !!checked)
                  }
                />
                <Label
                  htmlFor="cat-ls-pulses"
                  className="text-sm cursor-pointer select-none text-green-800 font-medium"
                >
                  LS Pulses
                </Label>
              </div>

              {/* LS Foods LLP */}
              <div className="flex items-center gap-3 p-2.5 rounded-md border border-orange-200 bg-orange-50/50 hover:bg-orange-50 transition-colors">
                <Checkbox
                  id="cat-ls-foods"
                  data-ocid="inventory.checkbox"
                  checked={selectedCategories.lsFoods}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle("lsFoods", !!checked)
                  }
                />
                <Label
                  htmlFor="cat-ls-foods"
                  className="text-sm cursor-pointer select-none text-orange-800 font-medium"
                >
                  LS Foods LLP
                </Label>
              </div>

              {/* Consolidated */}
              <div className="flex items-center gap-3 p-2.5 rounded-md border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                <Checkbox
                  id="cat-consolidated"
                  data-ocid="inventory.checkbox"
                  checked={selectedCategories.consolidated}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle("consolidated", !!checked)
                  }
                />
                <Label
                  htmlFor="cat-consolidated"
                  className="text-sm cursor-pointer select-none text-purple-800 font-medium"
                >
                  Consolidated
                </Label>
              </div>
            </div>

            {noneSelected && (
              <p
                className="text-xs text-red-500 font-medium"
                data-ocid="inventory.error_state"
              >
                Please select at least one category.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              data-ocid="inventory.cancel_button"
              onClick={() => setShowShareDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              data-ocid="inventory.primary_button"
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              disabled={noneSelected}
              onClick={handleShareConfirm}
            >
              <Share2 className="w-3.5 h-3.5" />
              Share on WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
