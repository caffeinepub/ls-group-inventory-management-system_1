import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type OrderListsData, useDataStore } from "@/contexts/DataStoreContext";
import {
  type DeliveryRecord,
  type OrderRecord,
  filterCompletedOrders,
  getOrderSummary,
  useOrdersStore,
} from "@/hooks/useInventoryStore";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Default Constants ────────────────────────────────────────────────────────────

const DEFAULT_BRANDS = [
  "Gh/Ind",
  "Tiranga Kutta",
  "Indica",
  "Ghadi(W)",
  "Ghadi(N)",
  "LS (N)",
  "LS(W)",
  "Bahubali",
  "Kasturi",
  "Tiranga Jarda",
  "Uttam",
];

const DEFAULT_BROKERS = [
  "Situ Lala",
  "Rambabu Lal",
  "H.T.",
  "Sanjeev Jain",
  "Piyush Goyal",
  "Yaman",
  "Mahesh",
  "Rakesh",
  "Mukesh Sharma",
  "Gulshan",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Display a stored YYYY-MM-DD string as DD-MM-YY */
function formatDDMMYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}-${mm}-${yyyy.slice(2)}`;
}

/** Sort orders by date descending (latest first) */
function sortOrdersByDateDesc(orders: OrderRecord[]): OrderRecord[] {
  return [...orders].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });
}

/** Get effective category for an order (default to Dal) */
function getCategory(order: OrderRecord): "Dal" | "Cattle Feed" {
  return order.category ?? "Dal";
}

// ─── Effective list builders ────────────────────────────────────────────────────────

function getEffectiveBrands(lists: OrderListsData): string[] {
  const deleted = new Set(lists.deletedBrands);
  return [
    ...DEFAULT_BRANDS.filter((b) => !deleted.has(b)),
    ...lists.customBrands,
  ];
}

function getEffectiveBrokers(lists: OrderListsData): string[] {
  const deleted = new Set(lists.deletedBrokers);
  return [
    ...DEFAULT_BROKERS.filter((b) => !deleted.has(b)),
    ...lists.customBrokers,
  ];
}

// ─── Manage List Dialog ────────────────────────────────────────────────────────────

function ManageListDialog({
  open,
  onClose,
  title,
  items,
  onAdd,
  onDelete,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onDelete: (item: string) => void;
  onEdit: (oldItem: string, newItem: string) => void;
}) {
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast.error("Item already exists in the list.");
      return;
    }
    onAdd(trimmed);
    setNewItem("");
    toast.success(`"${trimmed}" added to list.`);
  };

  const handleEdit = (item: string) => {
    setEditingItem(item);
    setEditValue(item);
  };

  const handleSaveEdit = (oldItem: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    if (trimmed !== oldItem && items.includes(trimmed)) {
      toast.error("Item already exists in the list.");
      return;
    }
    onEdit(oldItem, trimmed);
    setEditingItem(null);
    toast.success("Item updated.");
  };

  const handleDelete = (item: string) => {
    onDelete(item);
    toast.success(`"${item}" removed from list.`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md" data-ocid="orders.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-2">
              {editingItem === item ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-8 text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(item);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 border-green-400 text-green-700 hover:bg-green-50"
                    onClick={() => handleSaveEdit(item)}
                    data-ocid="orders.save_button"
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                    onClick={() => setEditingItem(null)}
                    data-ocid="orders.cancel_button"
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{item}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleEdit(item)}
                    title="Edit item"
                    data-ocid="orders.edit_button"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(item)}
                    title="Delete item"
                    data-ocid="orders.delete_button"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No items in list.
            </p>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            placeholder="Add new item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="h-8 text-sm flex-1"
            data-ocid="orders.input"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 border-accent text-accent hover:bg-accent/10"
            onClick={handleAdd}
            data-ocid="orders.secondary_button"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        <DialogFooter className="pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="orders.close_button"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ComboInput: dropdown + manage button + manual entry ──────────────────────────────

function ComboInput({
  value,
  onChange,
  options,
  placeholder,
  width = "w-32",
  onManage,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  width?: string;
  onManage?: () => void;
}) {
  const isKnownOption = options.includes(value);
  const [manualMode, setManualMode] = useState<boolean>(
    value !== "" && !isKnownOption,
  );

  const selectValue =
    manualMode || (!isKnownOption && value !== "") ? "__other__" : value;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 items-center">
        <select
          value={selectValue}
          onChange={(e) => {
            if (e.target.value === "__other__") {
              setManualMode(true);
              if (isKnownOption || value === "") onChange("");
            } else {
              setManualMode(false);
              onChange(e.target.value);
            }
          }}
          className={`h-8 text-xs border border-input rounded-md px-1 bg-background ${width}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value="__other__">Other (type manually)</option>
        </select>
        {onManage && (
          <button
            type="button"
            title={`Manage ${placeholder} list`}
            onClick={onManage}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            data-ocid="orders.open_modal_button"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {(manualMode || (!isKnownOption && value !== "")) && (
        <Input
          placeholder={`Type ${placeholder.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-7 text-xs ${width}`}
          autoFocus
        />
      )}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────────

interface EditableOrder {
  date: string;
  orderedBags: string;
  brand: string;
  rate: string;
  partyName: string;
  dalalName: string;
  remarks: string;
  category: "Dal" | "Cattle Feed";
}

function emptyOrder(): EditableOrder {
  return {
    date: todayString(),
    orderedBags: "",
    brand: "",
    rate: "",
    partyName: "",
    dalalName: "",
    remarks: "",
    category: "Dal",
  };
}

interface EditableDelivery {
  date: string;
  deliveredBags: string;
  brand: string;
  remarks: string;
}

function emptyDelivery(brand: string): EditableDelivery {
  return { date: todayString(), deliveredBags: "", brand, remarks: "" };
}

// ─── Order Edit Cells ─────────────────────────────────────────────────────────────────

function OrderEditCells({
  row,
  setRow,
  brandOptions,
  brokerOptions,
  onManageBrands,
  onManageBrokers,
}: {
  row: EditableOrder;
  setRow: (r: EditableOrder) => void;
  brandOptions: string[];
  brokerOptions: string[];
  onManageBrands: () => void;
  onManageBrokers: () => void;
}) {
  return (
    <>
      <td className="px-2 py-1.5">
        <Input
          type="date"
          value={row.date}
          onChange={(e) => setRow({ ...row, date: e.target.value })}
          className="h-8 text-xs w-32"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          type="number"
          min="0"
          placeholder="Bags"
          value={row.orderedBags}
          onChange={(e) => setRow({ ...row, orderedBags: e.target.value })}
          className="h-8 text-xs w-20"
        />
      </td>
      <td className="px-2 py-1.5 text-xs text-muted-foreground">—</td>
      <td className="px-2 py-1.5 text-xs text-muted-foreground">—</td>
      <td className="px-2 py-1.5">
        <ComboInput
          key={`brand-${row.brand}`}
          value={row.brand}
          onChange={(v) => setRow({ ...row, brand: v })}
          options={brandOptions}
          placeholder="Brand"
          width="w-32"
          onManage={onManageBrands}
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Rate"
          value={row.rate}
          onChange={(e) => setRow({ ...row, rate: e.target.value })}
          className="h-8 text-xs w-24"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          placeholder="Party Name"
          value={row.partyName}
          onChange={(e) => setRow({ ...row, partyName: e.target.value })}
          className="h-8 text-xs w-32"
        />
      </td>
      <td className="px-2 py-1.5">
        <ComboInput
          key={`broker-${row.dalalName}`}
          value={row.dalalName}
          onChange={(v) => setRow({ ...row, dalalName: v })}
          options={brokerOptions}
          placeholder="Broker"
          width="w-32"
          onManage={onManageBrokers}
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          placeholder="Remarks"
          value={row.remarks}
          onChange={(e) => setRow({ ...row, remarks: e.target.value })}
          className="h-8 text-xs w-32"
        />
      </td>
      <td className="px-2 py-1.5">
        <select
          value={row.category}
          onChange={(e) =>
            setRow({
              ...row,
              category: e.target.value as "Dal" | "Cattle Feed",
            })
          }
          className="h-8 text-xs border border-input rounded-md px-1 bg-background w-28"
        >
          <option value="Dal">Dal</option>
          <option value="Cattle Feed">Cattle Feed</option>
        </select>
      </td>
    </>
  );
}

// ─── Delivery Sub-row ──────────────────────────────────────────────────────────────────

function DeliverySubRow({
  delivery,
  onDelete,
}: {
  delivery: DeliveryRecord;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-indigo-100 bg-indigo-50/60">
      <td />
      <td className="px-3 py-1.5 text-xs text-indigo-700 whitespace-nowrap pl-6">
        {formatDDMMYY(delivery.date)}
      </td>
      <td />
      <td className="px-3 py-1.5 text-xs font-medium text-indigo-800">
        {delivery.deliveredBags}
      </td>
      <td className="px-3 py-1.5 text-xs text-indigo-700">{delivery.brand}</td>
      <td colSpan={4} className="px-3 py-1.5 text-xs text-indigo-600">
        {delivery.remarks}
      </td>
      <td />
      <td className="px-3 py-1.5 text-center">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </td>
    </tr>
  );
}

function DeliverySubRowCompleted({ delivery }: { delivery: DeliveryRecord }) {
  return (
    <tr className="border-b border-indigo-100 bg-indigo-50/40">
      <td />
      <td className="px-3 py-1.5 text-xs text-indigo-700 whitespace-nowrap pl-6">
        {formatDDMMYY(delivery.date)}
      </td>
      <td />
      <td className="px-3 py-1.5 text-xs font-medium text-indigo-800">
        {delivery.deliveredBags}
      </td>
      <td className="px-3 py-1.5 text-xs text-indigo-700">{delivery.brand}</td>
      <td colSpan={5} className="px-3 py-1.5 text-xs text-indigo-600">
        {delivery.remarks}
      </td>
    </tr>
  );
}

// ─── Add Delivery Inline Form ───────────────────────────────────────────────────────────

function AddDeliveryRow({
  orderBrand,
  orderDate,
  brandOptions,
  onSave,
  onCancel,
}: {
  orderBrand: string;
  orderDate: string;
  brandOptions: string[];
  onSave: (d: EditableDelivery) => void;
  onCancel: () => void;
}) {
  const [row, setRow] = useState<EditableDelivery>(emptyDelivery(orderBrand));
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!row.date || !row.deliveredBags.trim()) {
      toast.error("Date and Delivered Bags are required");
      return;
    }
    if (row.date < orderDate) {
      toast.error("Delivery date cannot be before the order creation date");
      return;
    }
    setSaving(true);
    onSave(row);
    setSaving(false);
  };

  return (
    <tr className="border-b border-indigo-200 bg-indigo-50">
      <td />
      <td className="px-2 py-1 pl-6">
        <Input
          type="date"
          value={row.date}
          min={orderDate}
          onChange={(e) => setRow({ ...row, date: e.target.value })}
          className="h-7 text-xs w-32"
        />
      </td>
      <td />
      <td className="px-2 py-1">
        <Input
          type="number"
          min="0"
          placeholder="Del. Bags"
          value={row.deliveredBags}
          onChange={(e) => setRow({ ...row, deliveredBags: e.target.value })}
          className="h-7 text-xs w-20"
        />
      </td>
      <td className="px-2 py-1">
        <ComboInput
          value={row.brand}
          onChange={(v) => setRow({ ...row, brand: v })}
          options={brandOptions}
          placeholder="Brand"
          width="w-28"
        />
      </td>
      <td colSpan={4} className="px-2 py-1">
        <Input
          placeholder="Remarks"
          value={row.remarks}
          onChange={(e) => setRow({ ...row, remarks: e.target.value })}
          className="h-7 text-xs w-40"
        />
      </td>
      <td />
      <td className="px-2 py-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 border-green-400 text-green-700 hover:bg-green-50 text-xs"
            onClick={handleSave}
            disabled={saving}
            data-ocid="orders.save_button"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 border-red-400 text-red-700 hover:bg-red-50 text-xs"
            onClick={onCancel}
            data-ocid="orders.cancel_button"
          >
            ✕
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ─── Active Orders Table ────────────────────────────────────────────────────────────────

function ActiveOrdersTable({
  orders,
  store,
  brandOptions,
  brokerOptions,
  onManageBrands,
  onManageBrokers,
  categoryFilter,
}: {
  orders: OrderRecord[];
  store: ReturnType<typeof useOrdersStore>;
  brandOptions: string[];
  brokerOptions: string[];
  onManageBrands: () => void;
  onManageBrokers: () => void;
  categoryFilter: "Dal" | "Cattle Feed";
}) {
  const { addOrder, updateOrder, deleteOrder, addDelivery } = store;

  const [newRow, setNewRow] = useState<EditableOrder | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<EditableOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addingDeliveryId, setAddingDeliveryId] = useState<string | null>(null);

  const activeOrders = orders
    .filter((o) => !getOrderSummary(o).isCompleted)
    .filter((o) => getCategory(o) === categoryFilter);
  const displayOrders = sortOrdersByDateDesc(activeOrders);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveNew = () => {
    if (!newRow) return;
    if (!newRow.date || !newRow.orderedBags.trim()) {
      toast.error("Date and Ordered Bags are required");
      return;
    }
    setSaving(true);
    try {
      addOrder({
        date: newRow.date,
        orderedBags: newRow.orderedBags,
        brand: newRow.brand,
        rate: newRow.rate,
        partyName: newRow.partyName,
        dalalName: newRow.dalalName,
        remarks: newRow.remarks,
        category: newRow.category,
      });
      setNewRow(null);
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editRow || !editingId) return;
    if (!editRow.date || !editRow.orderedBags.trim()) {
      toast.error("Date and Ordered Bags are required");
      return;
    }
    setSaving(true);
    try {
      updateOrder(editingId, {
        date: editRow.date,
        orderedBags: editRow.orderedBags,
        brand: editRow.brand,
        rate: editRow.rate,
        partyName: editRow.partyName,
        dalalName: editRow.dalalName,
        remarks: editRow.remarks,
        category: editRow.category,
      });
      setEditingId(null);
      setEditRow(null);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteOrder(id);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const handleAddDelivery = (orderId: string, d: EditableDelivery) => {
    try {
      addDelivery(orderId, {
        date: d.date,
        deliveredBags: d.deliveredBags,
        brand: d.brand,
        remarks: d.remarks,
      });
      setAddingDeliveryId(null);
      toast.success("Delivery added");
    } catch {
      toast.error("Failed to add delivery");
    }
  };

  const cols = [
    "Date",
    "Ordered Bags",
    "Delivered Bags",
    "Remaining Bags",
    "Brand",
    "Rate (Qtl)",
    "Party Name",
    "Broker",
    "Remarks",
    "Category",
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end px-4 py-2">
        <Button
          size="sm"
          onClick={() => {
            const row = emptyOrder();
            row.category = categoryFilter;
            setNewRow(row);
          }}
          disabled={!!newRow}
          data-ocid="orders.open_modal_button"
          className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs font-semibold"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Order
        </Button>
      </div>
      <table className="w-full text-sm min-w-[1200px]">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            <th className="w-8" />
            {cols.map((col) => (
              <th
                key={col}
                className="text-left px-3 py-2.5 font-semibold text-foreground whitespace-nowrap"
              >
                {col}
              </th>
            ))}
            <th className="text-center px-3 py-2.5 font-semibold text-foreground w-28">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {newRow && (
            <tr className="border-b border-border bg-accent/5">
              <td />
              <OrderEditCells
                row={newRow}
                setRow={setNewRow}
                brandOptions={brandOptions}
                brokerOptions={brokerOptions}
                onManageBrands={onManageBrands}
                onManageBrokers={onManageBrokers}
              />
              <td className="px-2 py-1.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50 text-xs"
                    onClick={handleSaveNew}
                    disabled={saving}
                    data-ocid="orders.save_button"
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50 text-xs"
                    onClick={() => setNewRow(null)}
                    data-ocid="orders.cancel_button"
                  >
                    ✕
                  </Button>
                </div>
              </td>
            </tr>
          )}

          {displayOrders.length === 0 && !newRow ? (
            <tr>
              <td
                colSpan={12}
                className="px-4 py-10 text-center text-muted-foreground text-sm"
                data-ocid="orders.empty_state"
              >
                No active {categoryFilter} orders. Click &quot;Add Order&quot;
                to create one.
              </td>
            </tr>
          ) : (
            displayOrders.map((order, idx) => {
              const { delivered, remaining } = getOrderSummary(order);
              const isExpanded = expandedIds.has(order.id);
              const isEditing = editingId === order.id;
              const sortedDeliveries = [...order.deliveries].sort((a, b) =>
                a.date.localeCompare(b.date),
              );

              return (
                <>
                  {isEditing ? (
                    <tr
                      key={`edit-${order.id}`}
                      className="border-b border-border bg-accent/5"
                      data-ocid={`orders.row.${idx + 1}`}
                    >
                      <td />
                      {editRow && (
                        <OrderEditCells
                          row={editRow}
                          setRow={setEditRow}
                          brandOptions={brandOptions}
                          brokerOptions={brokerOptions}
                          onManageBrands={onManageBrands}
                          onManageBrokers={onManageBrokers}
                        />
                      )}
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50 text-xs"
                            onClick={handleSaveEdit}
                            disabled={saving}
                            data-ocid="orders.save_button"
                          >
                            {saving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50 text-xs"
                            onClick={() => {
                              setEditingId(null);
                              setEditRow(null);
                            }}
                            data-ocid="orders.cancel_button"
                          >
                            ✕
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                      data-ocid={`orders.row.${idx + 1}`}
                    >
                      <td className="px-1 py-2.5 text-center">
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => toggleExpand(order.id)}
                          data-ocid="orders.toggle"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                        {formatDDMMYY(order.date)}
                      </td>
                      <td className="px-3 py-2.5 text-sm">
                        {order.orderedBags}
                      </td>
                      <td className="px-3 py-2.5 text-sm">{delivered}</td>
                      <td
                        className={`px-3 py-2.5 text-sm font-medium ${
                          remaining <= 0 ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        {remaining}
                      </td>
                      <td className="px-3 py-2.5 text-sm">{order.brand}</td>
                      <td className="px-3 py-2.5 text-sm">{order.rate}</td>
                      <td className="px-3 py-2.5 text-sm">{order.partyName}</td>
                      <td className="px-3 py-2.5 text-sm">{order.dalalName}</td>
                      <td className="px-3 py-2.5 text-sm">{order.remarks}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            getCategory(order) === "Dal"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {getCategory(order)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingId(order.id);
                              setEditRow({
                                date: order.date,
                                orderedBags: order.orderedBags,
                                brand: order.brand,
                                rate: order.rate,
                                partyName: order.partyName,
                                dalalName: order.dalalName,
                                remarks: order.remarks,
                                category: getCategory(order),
                              });
                            }}
                            data-ocid={`orders.edit_button.${idx + 1}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50 text-xs"
                            onClick={() => handleDelete(order.id)}
                            data-ocid={`orders.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {isExpanded && !isEditing && (
                    <>
                      {sortedDeliveries.map((delivery) => (
                        <DeliverySubRow
                          key={delivery.id}
                          delivery={delivery}
                          onDelete={() => {
                            try {
                              store.deleteDelivery(order.id, delivery.id);
                              toast.success("Delivery removed");
                            } catch {
                              toast.error("Failed to remove delivery");
                            }
                          }}
                        />
                      ))}

                      {addingDeliveryId === order.id ? (
                        <AddDeliveryRow
                          key={`add-del-${order.id}`}
                          orderBrand={order.brand}
                          orderDate={order.date}
                          brandOptions={brandOptions}
                          onSave={(d) => handleAddDelivery(order.id, d)}
                          onCancel={() => setAddingDeliveryId(null)}
                        />
                      ) : (
                        <tr
                          key={`add-btn-${order.id}`}
                          className="bg-indigo-50/40 border-b border-indigo-100"
                        >
                          <td colSpan={12} className="px-4 py-1.5 pl-8">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                              onClick={() => setAddingDeliveryId(order.id)}
                              data-ocid="orders.secondary_button"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Delivery
                            </Button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Completed Orders Table ────────────────────────────────────────────────────────────

function CompletedOrdersTable({
  orders,
  categoryFilter,
}: {
  orders: OrderRecord[];
  categoryFilter: "Dal" | "Cattle Feed";
}) {
  const completed = filterCompletedOrders(orders).filter(
    (o) => getCategory(o) === categoryFilter,
  );
  const display = sortOrdersByDateDesc(completed);

  const cols = [
    "Date",
    "Ordered Bags",
    "Delivered Bags",
    "Remaining Bags",
    "Brand",
    "Rate (Qtl)",
    "Party Name",
    "Broker",
    "Remarks",
    "Category",
  ];

  if (display.length === 0) {
    return (
      <div
        className="py-14 text-center text-muted-foreground text-sm"
        data-ocid="orders.empty_state"
      >
        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
        No completed {categoryFilter} orders in the past 3 months.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1200px]">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            <th className="w-8" />
            {cols.map((col) => (
              <th
                key={col}
                className="text-left px-3 py-2.5 font-semibold text-foreground whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((order, idx) => {
            const { delivered, remaining } = getOrderSummary(order);
            const sortedDeliveries = [...order.deliveries].sort((a, b) =>
              a.date.localeCompare(b.date),
            );
            return (
              <>
                <tr
                  key={order.id}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                  data-ocid={`orders.row.${idx + 1}`}
                >
                  <td />
                  <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                    {formatDDMMYY(order.date)}
                  </td>
                  <td className="px-3 py-2.5 text-sm">{order.orderedBags}</td>
                  <td className="px-3 py-2.5 text-sm">{delivered}</td>
                  <td className="px-3 py-2.5 text-sm font-medium text-green-600">
                    {remaining}
                  </td>
                  <td className="px-3 py-2.5 text-sm">{order.brand}</td>
                  <td className="px-3 py-2.5 text-sm">{order.rate}</td>
                  <td className="px-3 py-2.5 text-sm">{order.partyName}</td>
                  <td className="px-3 py-2.5 text-sm">{order.dalalName}</td>
                  <td className="px-3 py-2.5 text-sm">{order.remarks}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        getCategory(order) === "Dal"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {getCategory(order)}
                    </span>
                  </td>
                </tr>
                {sortedDeliveries.map((delivery) => (
                  <DeliverySubRowCompleted
                    key={delivery.id}
                    delivery={delivery}
                  />
                ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Orders Left Tab ────────────────────────────────────────────────────────────────────

interface BrokerSummary {
  broker: string;
  totalRemaining: number;
  brands: Array<{ brand: string; remaining: number }>;
}

function OrdersLeftTab({ orders }: { orders: OrderRecord[] }) {
  // Only active (non-completed) orders
  const activeOrders = orders.filter((o) => !getOrderSummary(o).isCompleted);

  // Group by broker, accumulate remaining bags per brand
  const brokerMap = new Map<string, Map<string, number>>();
  for (const order of activeOrders) {
    const { remaining } = getOrderSummary(order);
    if (remaining <= 0) continue;
    const broker = order.dalalName || "Unknown";
    const brand = order.brand || "Unknown";
    if (!brokerMap.has(broker)) brokerMap.set(broker, new Map());
    const brandMap = brokerMap.get(broker)!;
    brandMap.set(brand, (brandMap.get(brand) ?? 0) + remaining);
  }

  // Build sorted list (descending by total remaining)
  const summaries: BrokerSummary[] = [];
  for (const [broker, brandMap] of brokerMap.entries()) {
    const brands = Array.from(brandMap.entries())
      .map(([brand, remaining]) => ({ brand, remaining }))
      .sort((a, b) => b.remaining - a.remaining);
    const totalRemaining = brands.reduce((s, b) => s + b.remaining, 0);
    summaries.push({ broker, totalRemaining, brands });
  }
  summaries.sort((a, b) => b.totalRemaining - a.totalRemaining);

  if (summaries.length === 0) {
    return (
      <div
        className="py-14 text-center text-muted-foreground text-sm"
        data-ocid="orders.empty_state"
      >
        <TrendingDown className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
        All orders are fully delivered — no pending bags remaining.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-muted-foreground">
        Showing all active orders with remaining undelivered bags, grouped by
        broker (highest remaining first).
      </p>
      {summaries.map((s, idx) => (
        <div
          key={s.broker}
          className="border border-border rounded-lg overflow-hidden"
          data-ocid={`orders.item.${idx + 1}`}
        >
          {/* Broker header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                {s.broker}
              </span>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
              {s.totalRemaining} bags remaining
            </span>
          </div>
          {/* Brand breakdown */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                  Brand / Variety
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                  Remaining Bags
                </th>
              </tr>
            </thead>
            <tbody>
              {s.brands.map((b) => (
                <tr
                  key={b.brand}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-2 text-sm">{b.brand}</td>
                  <td className="px-4 py-2 text-sm text-right font-medium text-orange-600">
                    {b.remaining}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Category Sub-tabs ─────────────────────────────────────────────────────────────────

function CategorySubTabs({
  active,
  onChange,
}: {
  active: "Dal" | "Cattle Feed";
  onChange: (v: "Dal" | "Cattle Feed") => void;
}) {
  return (
    <div className="flex items-center gap-0 border-b border-border px-4 bg-muted/20">
      {(["Dal", "Cattle Feed"] as const).map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          data-ocid="orders.tab"
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            active === cat
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────────────

export default function OrdersTab() {
  const store = useOrdersStore();
  const orders = store.getOrders();
  const { orderListsData, updateOrderListsData } = useDataStore();

  const [section, setSection] = useState<"active" | "completed" | "left">(
    "active",
  );
  const [activeCategory, setActiveCategory] = useState<"Dal" | "Cattle Feed">(
    "Dal",
  );
  const [completedCategory, setCompletedCategory] = useState<
    "Dal" | "Cattle Feed"
  >("Dal");

  const [managingBrands, setManagingBrands] = useState(false);
  const [managingBrokers, setManagingBrokers] = useState(false);

  const brandOptions = getEffectiveBrands(orderListsData);
  const brokerOptions = getEffectiveBrokers(orderListsData);

  // ─── Brand list management handlers
  const handleAddBrand = (item: string) => {
    updateOrderListsData({
      ...orderListsData,
      customBrands: [...orderListsData.customBrands, item],
    });
  };

  const handleDeleteBrand = (item: string) => {
    const isDefault = DEFAULT_BRANDS.includes(item);
    if (isDefault) {
      updateOrderListsData({
        ...orderListsData,
        deletedBrands: [...orderListsData.deletedBrands, item],
      });
    } else {
      updateOrderListsData({
        ...orderListsData,
        customBrands: orderListsData.customBrands.filter((b) => b !== item),
      });
    }
  };

  const handleEditBrand = (oldItem: string, newItem: string) => {
    const isDefault = DEFAULT_BRANDS.includes(oldItem);
    if (isDefault) {
      // "Edit" a default = delete old, add new custom
      updateOrderListsData({
        ...orderListsData,
        deletedBrands: [...orderListsData.deletedBrands, oldItem],
        customBrands: [...orderListsData.customBrands, newItem],
      });
    } else {
      updateOrderListsData({
        ...orderListsData,
        customBrands: orderListsData.customBrands.map((b) =>
          b === oldItem ? newItem : b,
        ),
      });
    }
  };

  // ─── Broker list management handlers
  const handleAddBroker = (item: string) => {
    updateOrderListsData({
      ...orderListsData,
      customBrokers: [...orderListsData.customBrokers, item],
    });
  };

  const handleDeleteBroker = (item: string) => {
    const isDefault = DEFAULT_BROKERS.includes(item);
    if (isDefault) {
      updateOrderListsData({
        ...orderListsData,
        deletedBrokers: [...orderListsData.deletedBrokers, item],
      });
    } else {
      updateOrderListsData({
        ...orderListsData,
        customBrokers: orderListsData.customBrokers.filter((b) => b !== item),
      });
    }
  };

  const handleEditBroker = (oldItem: string, newItem: string) => {
    const isDefault = DEFAULT_BROKERS.includes(oldItem);
    if (isDefault) {
      updateOrderListsData({
        ...orderListsData,
        deletedBrokers: [...orderListsData.deletedBrokers, oldItem],
        customBrokers: [...orderListsData.customBrokers, newItem],
      });
    } else {
      updateOrderListsData({
        ...orderListsData,
        customBrokers: orderListsData.customBrokers.map((b) =>
          b === oldItem ? newItem : b,
        ),
      });
    }
  };

  return (
    <>
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <ClipboardList className="w-5 h-5 text-accent" />
              Orders
            </CardTitle>
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  section === "active"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted/60"
                }`}
                onClick={() => setSection("active")}
                data-ocid="orders.tab"
              >
                Active Orders
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 text-sm font-medium border-l border-border transition-colors ${
                  section === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted/60"
                }`}
                onClick={() => setSection("completed")}
                data-ocid="orders.tab"
              >
                Completed Orders
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 text-sm font-medium border-l border-border transition-colors ${
                  section === "left"
                    ? "bg-orange-500 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted/60"
                }`}
                onClick={() => setSection("left")}
                data-ocid="orders.tab"
              >
                Orders Left
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {section === "active" && (
            <>
              <CategorySubTabs
                active={activeCategory}
                onChange={setActiveCategory}
              />
              <ActiveOrdersTable
                orders={orders}
                store={store}
                brandOptions={brandOptions}
                brokerOptions={brokerOptions}
                onManageBrands={() => setManagingBrands(true)}
                onManageBrokers={() => setManagingBrokers(true)}
                categoryFilter={activeCategory}
              />
            </>
          )}
          {section === "completed" && (
            <>
              <CategorySubTabs
                active={completedCategory}
                onChange={setCompletedCategory}
              />
              <CompletedOrdersTable
                orders={orders}
                categoryFilter={completedCategory}
              />
            </>
          )}
          {section === "left" && <OrdersLeftTab orders={orders} />}
        </CardContent>
      </Card>

      {/* Manage Brands Dialog */}
      <ManageListDialog
        open={managingBrands}
        onClose={() => setManagingBrands(false)}
        title="Manage Brand List"
        items={brandOptions}
        onAdd={handleAddBrand}
        onDelete={handleDeleteBrand}
        onEdit={handleEditBrand}
      />

      {/* Manage Brokers Dialog */}
      <ManageListDialog
        open={managingBrokers}
        onClose={() => setManagingBrokers(false)}
        title="Manage Broker List"
        items={brokerOptions}
        onAdd={handleAddBroker}
        onDelete={handleDeleteBroker}
        onEdit={handleEditBroker}
      />
    </>
  );
}
