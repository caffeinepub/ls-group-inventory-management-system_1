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
import { useChangeLog } from "@/hooks/useChangeLog";
import {
  BARDANA_PRODUCTS,
  PLANTS,
  branchBadgeClass,
  branchTabClass,
  sortProducts,
  useBardanaCalculations,
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
  const { computeCurrentStock, getAddedBardana, getStockInWH } =
    useBardanaCalculations();

  const pulseProducts = getAllProducts("LS Pulses");
  const foodsProducts = getAllProducts("LS Foods LLP");

  const nameSet = new Set<string>();
  for (const p of pulseProducts) nameSet.add(p.name);
  for (const p of foodsProducts) nameSet.add(p.name);

  const merged = Array.from(nameSet).map((name) => {
    const pulseActual =
      pulseProducts.find((p) => p.name === name)?.quantity ?? 0;
    const foodsActual =
      foodsProducts.find((p) => p.name === name)?.quantity ?? 0;
    const pulseCS = computeCurrentStock("LS Pulses", name, pulseActual);
    const foodsCS = computeCurrentStock("LS Foods LLP", name, foodsActual);
    const pulseAB = getAddedBardana("LS Pulses", name);
    const foodsAB = getAddedBardana("LS Foods LLP", name);
    const pulseWH = getStockInWH("LS Pulses", name);
    const foodsWH = getStockInWH("LS Foods LLP", name);
    return {
      name,
      stockInWH: pulseWH + foodsWH,
      initialStock: pulseActual + foodsActual,
      currentStock: pulseCS + foodsCS,
      addedBardana: pulseAB + foodsAB,
    };
  });

  const sorted = sortProducts(
    merged.map((m) => ({ name: m.name, quantity: m.initialStock })),
    BARDANA_PRODUCTS,
  ).map((p) => merged.find((m) => m.name === p.name)!);

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
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-36">
                Stock in WH
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">
                Initial Stock
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">
                Current Stock
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">
                Added Bardana
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
                    variant={product.stockInWH > 0 ? "default" : "secondary"}
                    className={
                      product.stockInWH > 0
                        ? "bg-sky-100 text-sky-800 border border-sky-300 font-bold text-sm px-3"
                        : "font-bold text-sm px-3"
                    }
                  >
                    {product.stockInWH}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <Badge
                    variant={product.initialStock > 0 ? "default" : "secondary"}
                    className={
                      product.initialStock > 0
                        ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold text-sm px-3"
                        : "font-bold text-sm px-3"
                    }
                  >
                    {product.initialStock}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <Badge
                    variant={product.currentStock > 0 ? "default" : "secondary"}
                    className={
                      product.currentStock > 0
                        ? "bg-green-100 text-green-800 border border-green-300 font-bold text-sm px-3"
                        : "font-bold text-sm px-3"
                    }
                  >
                    {product.currentStock}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-sm text-muted-foreground">
                    {product.addedBardana > 0 ? product.addedBardana : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-border bg-purple-50/40">
        <p className="text-xs text-purple-700 font-medium">
          Current Stock = LS Pulses Current Stock + LS Foods LLP Current Stock
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
  const {
    computeCurrentStock,
    recordAddedBardana,
    getAddedBardana,
    getStockInWH,
    setStockInWH,
  } = useBardanaCalculations();
  const { currentUser } = useAuth();
  const { actor } = useActor();
  const { logBardanaChange } = useChangeLog();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editingWHProduct, setEditingWHProduct] = useState<string | null>(null);
  const [editWHValue, setEditWHValue] = useState<string>("");
  const [addingBardanaFor, setAddingBardanaFor] = useState<string | null>(null);
  const [bardanaInputValue, setBardanaInputValue] = useState<string>("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bardanaInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === "admin";
  const products = getOrderedProducts(plantKey);

  // ── Initial Stock (formerly Actual Stock) editing ────────────────────────
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
    const prevQty =
      getOrderedProducts(plantKey).find((p) => p.name === productName)
        ?.quantity ?? 0;
    const oldCS = computeCurrentStock(plantKey, productName, prevQty);

    setStock(plantKey, productName, qty);
    toast.success(`Updated ${productName} initial stock to ${qty}`);

    const userId = currentUser?.username ?? "unknown";
    logBardanaChange(
      plantKey,
      productName,
      "Initial Stock",
      prevQty,
      qty,
      userId,
    );

    const newCS = computeCurrentStock(plantKey, productName, qty);
    if (oldCS !== newCS) {
      logBardanaChange(
        plantKey,
        productName,
        "Current Stock",
        oldCS,
        newCS,
        userId,
      );
    }

    setEditingProduct(null);
    setEditValue("");

    if (actor) {
      actor.setBardanaStock(plantKey, productName, qty).catch(() => {});
    }
  };

  // ── Stock in WH editing ──────────────────────────────────────────────────
  const startEditWH = (productName: string) => {
    setEditingWHProduct(productName);
    setEditWHValue(String(getStockInWH(plantKey, productName)));
  };
  const cancelEditWH = () => {
    setEditingWHProduct(null);
    setEditWHValue("");
  };
  const saveEditWH = (productName: string) => {
    const val = Number.parseFloat(editWHValue);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Value must be a non-negative number");
      return;
    }
    setStockInWH(plantKey, productName, val);
    toast.success(`Updated ${productName} Stock in WH to ${val}`);
    setEditingWHProduct(null);
    setEditWHValue("");
  };

  // ── Added Bardana editing ────────────────────────────────────────────────
  const startAddBardana = (productName: string) => {
    setAddingBardanaFor(productName);
    setBardanaInputValue("");
    setTimeout(() => bardanaInputRef.current?.focus(), 50);
  };
  const cancelAddBardana = () => {
    setAddingBardanaFor(null);
    setBardanaInputValue("");
  };
  const saveAddBardana = (productName: string, productQty: number) => {
    const val = Number.parseFloat(bardanaInputValue);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Value must be a non-negative number");
      return;
    }
    if (val === 0) {
      cancelAddBardana();
      return;
    }
    const oldAB = getAddedBardana(plantKey, productName);
    const oldCS = computeCurrentStock(plantKey, productName, productQty);
    recordAddedBardana(plantKey, productName, val);
    const newAB = oldAB + val;
    const newCS = computeCurrentStock(plantKey, productName, productQty);

    const userId = currentUser?.username ?? "unknown";
    logBardanaChange(
      plantKey,
      productName,
      "Added Bardana",
      oldAB,
      newAB,
      userId,
    );
    if (oldCS !== newCS) {
      logBardanaChange(
        plantKey,
        productName,
        "Current Stock",
        oldCS,
        newCS,
        userId,
      );
    }

    toast.success(`Added ${val} bardana for ${productName}`);
    setAddingBardanaFor(null);
    setBardanaInputValue("");
  };

  // ── Add / Delete products ────────────────────────────────────────────────
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

  // Column count: #, Product, Stock in WH, Initial Stock, Action, Current Stock, Added Bardana, Order, [Delete]
  const colSpan = isAdmin ? 9 : 8;

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
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-36">
                Stock in WH
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">
                Initial Stock
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-32">
                Action
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-40">
                Current Stock
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-44">
                Added Bardana
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
            {products.map((product, idx) => {
              const currentStock = computeCurrentStock(
                plantKey,
                product.name,
                product.quantity,
              );
              const addedBardana = getAddedBardana(plantKey, product.name);
              const stockInWH = getStockInWH(plantKey, product.name);
              return (
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

                  {/* Stock in WH (editable) */}
                  <td className="px-4 py-2.5 text-center">
                    {editingWHProduct === product.name ? (
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editWHValue}
                          onChange={(e) => setEditWHValue(e.target.value)}
                          className="w-24 text-center h-8 text-sm"
                          data-ocid="bardana.input"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditWH(product.name);
                            if (e.key === "Escape") cancelEditWH();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50"
                          onClick={() => saveEditWH(product.name)}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                          onClick={cancelEditWH}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1 px-3 h-7 rounded-md border border-dashed border-sky-400 bg-sky-50 text-sky-700 text-xs hover:bg-sky-100 transition-colors cursor-pointer"
                        onClick={() => startEditWH(product.name)}
                        title="Click to edit Stock in WH"
                      >
                        <Pencil className="w-3 h-3" />
                        {stockInWH > 0 ? stockInWH : "Set"}
                      </button>
                    )}
                  </td>

                  {/* Initial Stock (formerly Actual Stock) */}
                  <td className="px-4 py-2.5 text-center">
                    {editingProduct === product.name ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-28 mx-auto text-center h-8 text-sm"
                        data-ocid="bardana.input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(product.name);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : (
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
                    )}
                  </td>

                  {/* Action column */}
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
                        onClick={() =>
                          startEdit(product.name, product.quantity)
                        }
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </td>

                  {/* Current Stock (calculated) */}
                  <td className="px-4 py-2.5 text-center">
                    <Badge
                      variant={currentStock > 0 ? "default" : "secondary"}
                      className={
                        currentStock > 0
                          ? "bg-green-100 text-green-800 border border-green-300 font-bold text-sm px-3"
                          : "font-bold text-sm px-3"
                      }
                    >
                      {currentStock % 1 === 0
                        ? currentStock.toFixed(0)
                        : currentStock}
                    </Badge>
                  </td>

                  {/* Added Bardana (editable, accumulates) */}
                  <td className="px-4 py-2.5 text-center">
                    {addingBardanaFor === product.name ? (
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          ref={bardanaInputRef}
                          type="number"
                          min="0"
                          step="1"
                          value={bardanaInputValue}
                          onChange={(e) => setBardanaInputValue(e.target.value)}
                          className="w-24 text-center h-8 text-sm"
                          data-ocid="bardana.input"
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              saveAddBardana(product.name, product.quantity);
                            if (e.key === "Escape") cancelAddBardana();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50"
                          onClick={() =>
                            saveAddBardana(product.name, product.quantity)
                          }
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                          onClick={cancelAddBardana}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 px-3 h-7 rounded-md border border-dashed border-amber-400 bg-amber-50 text-amber-700 text-xs hover:bg-amber-100 transition-colors cursor-pointer"
                        data-ocid={`bardana.add_bardana_button.${idx + 1}`}
                        onClick={() => startAddBardana(product.name)}
                      >
                        <Plus className="w-3 h-3" />
                        {addedBardana > 0 ? addedBardana : "Add"}
                      </button>
                    )}
                  </td>

                  {/* Reorder */}
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() =>
                          reorderProduct(plantKey, product.name, "up")
                        }
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
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
                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
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
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-400 transition-all duration-150 cursor-pointer"
                        title={`Delete ${product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
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
  const { computeCurrentStock } = useBardanaCalculations();
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

    const pulseRaw = getAllProducts("LS Pulses");
    const foodsRaw = getAllProducts("LS Foods LLP");

    const pulseProducts = sortProducts(pulseRaw, BARDANA_PRODUCTS)
      .map((p) => ({
        name: p.name,
        quantity: computeCurrentStock("LS Pulses", p.name, p.quantity),
      }))
      .filter((p) => p.quantity > 0);

    const foodsProducts = sortProducts(foodsRaw, BARDANA_PRODUCTS)
      .map((p) => ({
        name: p.name,
        quantity: computeCurrentStock("LS Foods LLP", p.name, p.quantity),
      }))
      .filter((p) => p.quantity > 0);

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
    if (selectedCategories.lsPulses)
      addedSections.push(formatSection("LS Pulses", pulseProducts));
    if (selectedCategories.lsFoods)
      addedSections.push(formatSection("LS Foods LLP", foodsProducts));
    if (selectedCategories.consolidated)
      addedSections.push(formatSection("Consolidated", consolidated));
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
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Checkbox
                id="all-categories"
                checked={allSelected}
                onCheckedChange={(checked) => handleAllToggle(checked === true)}
                className="data-[state=checked]:bg-blue-600"
              />
              <Label
                htmlFor="all-categories"
                className="font-semibold cursor-pointer"
              >
                All Categories
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ls-pulses"
                checked={selectedCategories.lsPulses}
                onCheckedChange={(checked) =>
                  handleCategoryToggle("lsPulses", checked === true)
                }
                className="data-[state=checked]:bg-green-600"
              />
              <Label
                htmlFor="ls-pulses"
                className="cursor-pointer text-green-800"
              >
                LS Pulses
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ls-foods"
                checked={selectedCategories.lsFoods}
                onCheckedChange={(checked) =>
                  handleCategoryToggle("lsFoods", checked === true)
                }
                className="data-[state=checked]:bg-orange-500"
              />
              <Label
                htmlFor="ls-foods"
                className="cursor-pointer text-orange-800"
              >
                LS Foods LLP
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consolidated"
                checked={selectedCategories.consolidated}
                onCheckedChange={(checked) =>
                  handleCategoryToggle("consolidated", checked === true)
                }
                className="data-[state=checked]:bg-purple-600"
              />
              <Label
                htmlFor="consolidated"
                className="cursor-pointer text-purple-800"
              >
                Consolidated
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleShareConfirm}
              disabled={noneSelected}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share to WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
