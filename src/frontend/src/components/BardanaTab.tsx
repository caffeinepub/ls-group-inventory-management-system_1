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
import { useActor } from "@/hooks/useActor";
import {
  BARDANA_PRODUCTS,
  PLANTS,
  branchBadgeClass,
  branchTabClass,
  sortProducts,
  useBardanaStore,
} from "@/hooks/useInventoryStore";
import {
  ArrowDown,
  ArrowUp,
  Check,
  PackageOpen,
  Pencil,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ShareCategories {
  lsPulses: boolean;
  lsFoods: boolean;
  consolidated: boolean;
}

function ConsolidatedBardana() {
  const { getAllProducts } = useBardanaStore();
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

  const sorted = sortProducts(merged, BARDANA_PRODUCTS);

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
                data-ocid={`bardana.item.${idx + 1}`}
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

function PlantBardana({ plantKey }: { plantKey: string }) {
  const {
    getOrderedProducts,
    setStock,
    addProduct,
    deleteProduct,
    reorderProduct,
  } = useBardanaStore();
  const { currentUser } = useAuth();
  const { actor } = useActor();
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
    toast.success(`Updated ${productName} stock to ${qty}`);
    setEditingProduct(null);
    setEditValue("");

    if (actor) {
      actor.setBardanaStock(plantKey, productName, qty).catch(() => {});
    }
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
      toast.success(`"${trimmed}" added to bardana`);
      setShowAddRow(false);
      setNewProductName("");
    } else {
      toast.error(`"${trimmed}" already exists in this plant's bardana`);
    }
  };

  const handleCancelAdd = () => {
    setShowAddRow(false);
    setNewProductName("");
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteProduct(plantKey, deleteConfirm);
    toast.success(`"${deleteConfirm}" removed from bardana`);
    setDeleteConfirm(null);
  };

  // Admin column count: #, Product, Stock, EditStock, Action, Reorder, Delete = 7
  // Staff column count: #, Product, Stock, EditStock, Action, Reorder = 6
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
                data-ocid={`bardana.item.${idx + 1}`}
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
                        ? "bg-blue-100 text-blue-800 border-blue-200 font-bold text-sm px-3"
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
                      data-ocid="bardana.input"
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
                        data-ocid={`bardana.save_button.${idx + 1}`}
                        onClick={() => saveEdit(product.name)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                        data-ocid={`bardana.cancel_button.${idx + 1}`}
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
                      data-ocid={`bardana.edit_button.${idx + 1}`}
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
                      data-ocid="bardana.input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddProduct();
                        if (e.key === "Escape") handleCancelAdd();
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                      data-ocid="bardana.submit_button"
                      onClick={handleAddProduct}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      data-ocid="bardana.cancel_button"
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
            className="h-8 px-3 text-xs gap-1.5 text-blue-700 border-blue-400 hover:bg-blue-50"
            data-ocid="bardana.open_modal_button"
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
              from bardana? This action cannot be undone.
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

export default function BardanaTab() {
  const [activePlant, setActivePlant] = useState("ls-pulses");
  const { getAllProducts } = useBardanaStore();
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
      BARDANA_PRODUCTS,
    ).filter((p) => p.quantity > 0);
    const foodsProducts = sortProducts(
      getAllProducts("LS Foods LLP"),
      BARDANA_PRODUCTS,
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
      BARDANA_PRODUCTS,
    ).filter((p) => p.quantity > 0);

    const formatSection = (
      title: string,
      products: { name: string; quantity: number }[],
    ) => {
      if (products.length === 0) return `--- ${title} ---\nNo entries`;
      const rows = products.map((p) => `${p.name}: ${p.quantity}`).join("\n");
      return `--- ${title} ---\n${rows}`;
    };

    const sections: string[] = [
      "\uD83D\uDCE6 LS Group Bardana Report",
      `\uD83D\uDCC5 ${dateStr}`,
      "",
    ];

    const addedSections: string[] = [];
    if (selectedCategories.lsPulses) {
      addedSections.push(formatSection("LS Pulses", pulseProducts));
    }
    if (selectedCategories.lsFoods) {
      addedSections.push(formatSection("LS Foods LLP", foodsProducts));
    }
    if (selectedCategories.consolidated) {
      addedSections.push(formatSection("Consolidated", consolidated));
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
              <PackageOpen className="w-5 h-5 text-accent" />
              Bardana Stock Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                data-ocid="bardana.secondary_button"
                className="h-7 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
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
                    data-ocid="bardana.tab"
                    className={`font-semibold ${branchTabClass(plant)}`}
                  >
                    {plant}
                  </TabsTrigger>
                ))}
                <TabsTrigger
                  value="consolidated"
                  data-ocid="bardana.tab"
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
                <PlantBardana plantKey={plant} />
              </TabsContent>
            ))}
            <TabsContent value="consolidated" className="mt-0 pt-3">
              <ConsolidatedBardana />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Share Category Selection Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-sm" data-ocid="bardana.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
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
                id="bardana-cat-all"
                data-ocid="bardana.checkbox"
                checked={allSelected}
                onCheckedChange={(checked) => handleAllToggle(!!checked)}
              />
              <Label
                htmlFor="bardana-cat-all"
                className="font-semibold text-sm cursor-pointer select-none"
              >
                All Categories
              </Label>
            </div>

            <div className="pl-2 space-y-2">
              {/* LS Pulses */}
              <div className="flex items-center gap-3 p-2.5 rounded-md border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors">
                <Checkbox
                  id="bardana-cat-ls-pulses"
                  data-ocid="bardana.checkbox"
                  checked={selectedCategories.lsPulses}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle("lsPulses", !!checked)
                  }
                />
                <Label
                  htmlFor="bardana-cat-ls-pulses"
                  className="text-sm cursor-pointer select-none text-green-800 font-medium"
                >
                  LS Pulses
                </Label>
              </div>

              {/* LS Foods LLP */}
              <div className="flex items-center gap-3 p-2.5 rounded-md border border-orange-200 bg-orange-50/50 hover:bg-orange-50 transition-colors">
                <Checkbox
                  id="bardana-cat-ls-foods"
                  data-ocid="bardana.checkbox"
                  checked={selectedCategories.lsFoods}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle("lsFoods", !!checked)
                  }
                />
                <Label
                  htmlFor="bardana-cat-ls-foods"
                  className="text-sm cursor-pointer select-none text-orange-800 font-medium"
                >
                  LS Foods LLP
                </Label>
              </div>

              {/* Consolidated */}
              <div className="flex items-center gap-3 p-2.5 rounded-md border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                <Checkbox
                  id="bardana-cat-consolidated"
                  data-ocid="bardana.checkbox"
                  checked={selectedCategories.consolidated}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle("consolidated", !!checked)
                  }
                />
                <Label
                  htmlFor="bardana-cat-consolidated"
                  className="text-sm cursor-pointer select-none text-purple-800 font-medium"
                >
                  Consolidated
                </Label>
              </div>
            </div>

            {noneSelected && (
              <p
                className="text-xs text-red-500 font-medium"
                data-ocid="bardana.error_state"
              >
                Please select at least one category.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              data-ocid="bardana.cancel_button"
              onClick={() => setShowShareDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              data-ocid="bardana.primary_button"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
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
