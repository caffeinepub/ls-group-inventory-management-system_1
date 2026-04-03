import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useChangeLog } from "@/hooks/useChangeLog";
import {
  inventoryToBardanaProduct,
  useBardanaCalculations,
} from "@/hooks/useInventoryStore";
import { useTransactionLog } from "@/hooks/useTransactionLog";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InventoryStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  currentStock: number;
  plantKey: string;
  onSave: (productName: string, newQty: number) => void;
}

export default function InventoryStockDialog({
  open,
  onOpenChange,
  productName,
  currentStock,
  plantKey,
  onSave,
}: InventoryStockDialogProps) {
  const { logTransaction } = useTransactionLog();
  const { logInventoryChange } = useChangeLog();
  const { currentUser } = useAuth();
  const { addToAccumulatedInventory } = useBardanaCalculations();
  const [addValue, setAddValue] = useState("");
  const [subtractValue, setSubtractValue] = useState("");

  const addNum = Number.parseInt(addValue, 10);
  const subtractNum = Number.parseInt(subtractValue, 10);
  const safeAdd = Number.isNaN(addNum) || addNum < 0 ? 0 : addNum;
  const safeSubtract =
    Number.isNaN(subtractNum) || subtractNum < 0 ? 0 : subtractNum;
  const resultant = currentStock + safeAdd - safeSubtract;
  const isNegativeResult = resultant < 0;
  const hasChange = safeAdd !== 0 || safeSubtract !== 0;

  const resetFields = () => {
    setAddValue("");
    setSubtractValue("");
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetFields();
    onOpenChange(val);
  };

  const handleSave = () => {
    if (isNegativeResult) {
      toast.error("Resultant stock cannot be negative");
      return;
    }
    if (!hasChange) {
      onOpenChange(false);
      resetFields();
      return;
    }

    const userId = currentUser?.username ?? "unknown";

    // Save quantity
    onSave(productName, resultant);
    toast.success(`Stock updated: ${productName} → ${resultant}`);

    // Log to dedicated daily transaction log (for report Today's filling/selling)
    if (safeAdd > 0) {
      logTransaction(plantKey, productName, "add", safeAdd);
      // Update bardana accumulated inventory via hook
      const bardanaProd = inventoryToBardanaProduct(productName);
      if (bardanaProd) {
        addToAccumulatedInventory(plantKey, bardanaProd, safeAdd);
      }
    }
    if (safeSubtract > 0)
      logTransaction(plantKey, productName, "subtract", safeSubtract);

    // Log to change log
    if (safeAdd > 0) logInventoryChange(plantKey, productName, safeAdd, userId);
    if (safeSubtract > 0)
      logInventoryChange(plantKey, productName, -safeSubtract, userId);

    resetFields();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="inventory.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="w-5 h-5 text-accent" />
            {productName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add or subtract stock quantity. Integer values only.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            Current Stock
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {currentStock}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="inv-add-input"
              className="text-sm font-semibold text-green-700 dark:text-green-400"
            >
              Add
            </Label>
            <Input
              id="inv-add-input"
              data-ocid="inventory.input"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={addValue}
              onChange={(e) => {
                const val = e.target.value;
                if (
                  val === "" ||
                  (/^\d+$/.test(val) && Number.parseInt(val, 10) >= 0)
                )
                  setAddValue(val);
              }}
              className="text-center font-bold tabular-nums border-green-300 focus-visible:ring-green-400"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="inv-subtract-input"
              className="text-sm font-semibold text-red-600 dark:text-red-400"
            >
              Subtract
            </Label>
            <Input
              id="inv-subtract-input"
              data-ocid="inventory.input"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={subtractValue}
              onChange={(e) => {
                const val = e.target.value;
                if (
                  val === "" ||
                  (/^\d+$/.test(val) && Number.parseInt(val, 10) >= 0)
                )
                  setSubtractValue(val);
              }}
              className="text-center font-bold tabular-nums border-red-300 focus-visible:ring-red-400"
            />
          </div>
        </div>

        <div
          className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
            isNegativeResult
              ? "bg-destructive/10 border-destructive/40"
              : "bg-accent/10 border-accent/30"
          }`}
        >
          <span className="text-sm font-medium text-muted-foreground">
            Resultant Stock
          </span>
          <span
            className={`text-2xl font-bold tabular-nums ${
              isNegativeResult ? "text-destructive" : "text-accent"
            }`}
          >
            {resultant}
          </span>
        </div>

        {isNegativeResult && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Resultant stock cannot be negative. Reduce the subtract value.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            data-ocid="inventory.cancel_button"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            data-ocid="inventory.save_button"
            onClick={handleSave}
            disabled={isNegativeResult}
            className="min-w-[80px]"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
