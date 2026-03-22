import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const BRAND_OPTIONS = [
  "Gh/Ind",
  "Tiranga(K)",
  "Indica",
  "Ghadi(W)",
  "Ghadi(N)",
  "LS (N)",
  "LS(W)",
  "Bahubali",
  "Kasturi",
  "Tiranga(J)",
  "Uttam",
];

const BROKER_OPTIONS = [
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── ComboInput: dropdown + manual text entry ────────────────────────────────

function ComboInput({
  value,
  onChange,
  options,
  placeholder,
  width = "w-32",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  width?: string;
}) {
  // Track whether user has explicitly chosen "manual entry" mode
  const isKnownOption = options.includes(value);
  const [manualMode, setManualMode] = useState<boolean>(
    value !== "" && !isKnownOption,
  );

  const selectValue =
    manualMode || (!isKnownOption && value !== "") ? "__other__" : value;

  return (
    <div className="flex flex-col gap-1">
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === "__other__") {
            setManualMode(true);
            // Keep existing custom value if there is one, else clear
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface EditableOrder {
  date: string;
  orderedBags: string;
  brand: string;
  rate: string;
  partyName: string;
  dalalName: string;
  remarks: string;
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

// ─── Order Edit Cells ──────────────────────────────────────────────────────

function OrderEditCells({
  row,
  setRow,
}: {
  row: EditableOrder;
  setRow: (r: EditableOrder) => void;
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
          options={BRAND_OPTIONS}
          placeholder="Brand"
          width="w-32"
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
          options={BROKER_OPTIONS}
          placeholder="Broker"
          width="w-32"
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
    </>
  );
}

// ─── Delivery Sub-row ──────────────────────────────────────────────────────

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
      <td colSpan={3} className="px-3 py-1.5 text-xs text-indigo-600">
        {delivery.remarks}
      </td>
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
      <td colSpan={4} className="px-3 py-1.5 text-xs text-indigo-600">
        {delivery.remarks}
      </td>
    </tr>
  );
}

// ─── Add Delivery Inline Form ────────────────────────────────────────────────

function AddDeliveryRow({
  orderBrand,
  orderDate,
  onSave,
  onCancel,
}: {
  orderBrand: string;
  orderDate: string;
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
          options={BRAND_OPTIONS}
          placeholder="Brand"
          width="w-28"
        />
      </td>
      <td colSpan={3} className="px-2 py-1">
        <Input
          placeholder="Remarks"
          value={row.remarks}
          onChange={(e) => setRow({ ...row, remarks: e.target.value })}
          className="h-7 text-xs w-40"
        />
      </td>
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

// ─── Active Orders Table ─────────────────────────────────────────────────────

function ActiveOrdersTable({
  orders,
  store,
}: {
  orders: OrderRecord[];
  store: ReturnType<typeof useOrdersStore>;
}) {
  const { addOrder, updateOrder, deleteOrder, addDelivery } = store;

  const [newRow, setNewRow] = useState<EditableOrder | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<EditableOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addingDeliveryId, setAddingDeliveryId] = useState<string | null>(null);

  const activeOrders = orders.filter((o) => !getOrderSummary(o).isCompleted);
  // Sort by date descending (latest first), then by createdAt descending as tiebreaker
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
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end px-4 py-2">
        <Button
          size="sm"
          onClick={() => setNewRow(emptyOrder())}
          disabled={!!newRow}
          data-ocid="orders.open_modal_button"
          className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs font-semibold"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Order
        </Button>
      </div>
      <table className="w-full text-sm min-w-[1100px]">
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
              <OrderEditCells row={newRow} setRow={setNewRow} />
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
                colSpan={11}
                className="px-4 py-10 text-center text-muted-foreground text-sm"
                data-ocid="orders.empty_state"
              >
                No active orders. Click &quot;Add Order&quot; to create one.
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
                        <OrderEditCells row={editRow} setRow={setEditRow} />
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
                          onSave={(d) => handleAddDelivery(order.id, d)}
                          onCancel={() => setAddingDeliveryId(null)}
                        />
                      ) : (
                        <tr
                          key={`add-btn-${order.id}`}
                          className="bg-indigo-50/40 border-b border-indigo-100"
                        >
                          <td colSpan={11} className="px-4 py-1.5 pl-8">
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

// ─── Completed Orders Table ──────────────────────────────────────────────────

function CompletedOrdersTable({ orders }: { orders: OrderRecord[] }) {
  const completed = filterCompletedOrders(orders);
  // Sort by date descending (latest completed first)
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
  ];

  if (display.length === 0) {
    return (
      <div
        className="py-14 text-center text-muted-foreground text-sm"
        data-ocid="orders.empty_state"
      >
        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
        No completed orders in the past 3 months.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1100px]">
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OrdersTab() {
  const store = useOrdersStore();
  const orders = store.getOrders();
  const [section, setSection] = useState<"active" | "completed">("active");

  return (
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {section === "active" ? (
          <ActiveOrdersTable orders={orders} store={store} />
        ) : (
          <CompletedOrdersTable orders={orders} />
        )}
      </CardContent>
    </Card>
  );
}
