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
import { useSetInventoryStock } from "@/hooks/useQueries";
import { AlertTriangle, Info, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CURRENT_USER = "admin";

interface StockUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  currentStock: number;
  plantKey: string;
}

export default function StockUpdateDialog({
  open,
  onOpenChange,
  productName,
  currentStock,
  plantKey,
}: StockUpdateDialogProps) {
  const [addValue, setAddValue] = useState("");
  const [subtractValue, setSubtractValue] = useState("");
  const setStock = useSetInventoryStock();

  const addNum = Number.parseFloat(addValue) || 0;
  const subtractNum = Number.parseFloat(subtractValue) || 0;
  const resultant = currentStock + addNum - subtractNum;
  const isNegativeResult = resultant < 0;
  const hasChange = addNum !== 0 || subtractNum !== 0;

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setAddValue("");
      setSubtractValue("");
    }
    onOpenChange(val);
  };

  const handleSave = async () => {
    if (isNegativeResult) {
      toast.error("Resultant stock cannot be negative");
      return;
    }

    if (!hasChange) {
      onOpenChange(false);
      return;
    }

    if (!plantKey) {
      toast.error(
        "Plant key is missing — cannot update stock. Please refresh and try again.",
      );
      return;
    }

    try {
      await setStock.mutateAsync({
        plant: plantKey,
        productName,
        quantity: resultant,
        user: CURRENT_USER,
      });
      toast.success(`Stock updated: ${productName} → ${resultant}`);
      setAddValue("");
      setSubtractValue("");
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update stock";
      toast.error(message, { duration: 6000 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="w-5 h-5 text-accent" />
            {productName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update stock quantity for this product.
          </DialogDescription>
        </DialogHeader>

        {/* Plant Key Debug Info */}
        <div className="flex items-center gap-2 rounded-md bg-muted/40 border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            Plant:{" "}
            <span className="font-mono font-semibold text-foreground">
              {plantKey || "(none)"}
            </span>
          </span>
        </div>

        {/* Current Stock Display */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            Current Stock
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {currentStock}
          </span>
        </div>

        {/* Add / Subtract Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* Add */}
          <div className="space-y-1.5">
            <Label
              htmlFor="add-input"
              className="text-sm font-semibold text-green-700 dark:text-green-400"
            >
              Add
            </Label>
            <Input
              id="add-input"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              disabled={setStock.isPending}
              className="text-center font-bold tabular-nums border-green-300 focus-visible:ring-green-400"
            />
          </div>

          {/* Subtract */}
          <div className="space-y-1.5">
            <Label
              htmlFor="subtract-input"
              className="text-sm font-semibold text-red-600 dark:text-red-400"
            >
              Subtract
            </Label>
            <Input
              id="subtract-input"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={subtractValue}
              onChange={(e) => setSubtractValue(e.target.value)}
              disabled={setStock.isPending}
              className="text-center font-bold tabular-nums border-red-300 focus-visible:ring-red-400"
            />
          </div>
        </div>

        {/* Resultant Stock Preview */}
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

        {/* Negative Warning */}
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
            onClick={() => handleOpenChange(false)}
            disabled={setStock.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setStock.isPending || isNegativeResult}
            className="min-w-[80px]"
          >
            {setStock.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
