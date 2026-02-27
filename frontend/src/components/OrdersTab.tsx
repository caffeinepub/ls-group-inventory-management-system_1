import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Loader2, ClipboardList, Save } from 'lucide-react';
import {
  useGetOrders,
  useAddOrder,
  useUpdateOrder,
  useDeleteOrder,
} from '@/hooks/useQueries';
import { dateToNs, nsToDateString, todayString } from '@/lib/utils';
import { toast } from 'sonner';
import type { OrderView } from '../backend';

interface EditableOrder {
  id: bigint | null; // null = new unsaved row
  date: string;
  bags: string;
  brand: string;
  rate: string;
  partyName: string;
  dalalName: string;
  remarks: string;
}

function emptyRow(): EditableOrder {
  return {
    id: null,
    date: todayString(),
    bags: '',
    brand: '',
    rate: '',
    partyName: '',
    dalalName: '',
    remarks: '',
  };
}

function orderToEditable(o: OrderView): EditableOrder {
  return {
    id: o.id,
    date: nsToDateString(o.date),
    bags: String(o.bags),
    brand: o.brand,
    rate: String(o.rate),
    partyName: o.partyName,
    dalalName: o.dalalName,
    remarks: o.remarks,
  };
}

export default function OrdersTab() {
  const { data: orders, isLoading } = useGetOrders();
  const addOrder = useAddOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const [newRow, setNewRow] = useState<EditableOrder | null>(null);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editRow, setEditRow] = useState<EditableOrder | null>(null);

  const handleAddRow = () => {
    setNewRow(emptyRow());
  };

  const handleSaveNew = async () => {
    if (!newRow) return;
    const bags = parseInt(newRow.bags, 10);
    const rate = parseFloat(newRow.rate);
    if (!newRow.date || isNaN(bags) || isNaN(rate)) {
      toast.error('Please fill in Date, Bags, and Rate fields');
      return;
    }
    try {
      const dateNs = dateToNs(new Date(newRow.date));
      await addOrder.mutateAsync({
        date: dateNs,
        brand: newRow.brand,
        bags: BigInt(bags),
        rate,
        partyName: newRow.partyName,
        dalalName: newRow.dalalName,
        remarks: newRow.remarks,
      });
      setNewRow(null);
      toast.success('Order added');
    } catch {
      toast.error('Failed to add order');
    }
  };

  const handleCancelNew = () => setNewRow(null);

  const handleEdit = (order: OrderView) => {
    setEditingId(order.id);
    setEditRow(orderToEditable(order));
  };

  const handleSaveEdit = async () => {
    if (!editRow || editRow.id === null) return;
    const bags = parseInt(editRow.bags, 10);
    const rate = parseFloat(editRow.rate);
    if (!editRow.date || isNaN(bags) || isNaN(rate)) {
      toast.error('Please fill in Date, Bags, and Rate fields');
      return;
    }
    try {
      const dateNs = dateToNs(new Date(editRow.date));
      await updateOrder.mutateAsync({
        orderId: editRow.id,
        date: dateNs,
        bags: BigInt(bags),
        rate,
        partyName: editRow.partyName,
        dalalName: editRow.dalalName,
        remarks: editRow.remarks,
      });
      setEditingId(null);
      setEditRow(null);
      toast.success('Order updated');
    } catch {
      toast.error('Failed to update order');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRow(null);
  };

  const handleDelete = async (orderId: bigint) => {
    try {
      await deleteOrder.mutateAsync(orderId);
      toast.success('Order deleted');
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const cols = ['Date', 'Bags', 'Brand', 'Rate (Qtl)', 'Party Name', 'Dalal Name', 'Remarks'];

  const renderEditCells = (
    row: EditableOrder,
    setRow: (r: EditableOrder) => void
  ) => (
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
          step="1"
          placeholder="Bags"
          value={row.bags}
          onChange={(e) => setRow({ ...row, bags: e.target.value })}
          className="h-8 text-xs w-20"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          placeholder="Brand"
          value={row.brand}
          onChange={(e) => setRow({ ...row, brand: e.target.value })}
          className="h-8 text-xs w-28"
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
        <Input
          placeholder="Dalal Name"
          value={row.dalalName}
          onChange={(e) => setRow({ ...row, dalalName: e.target.value })}
          className="h-8 text-xs w-28"
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

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <ClipboardList className="w-5 h-5 text-accent" />
            Orders
          </CardTitle>
          <Button
            size="sm"
            onClick={handleAddRow}
            disabled={!!newRow}
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs font-semibold"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Order
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  {cols.map((col) => (
                    <th key={col} className="text-left px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="text-center px-3 py-2.5 font-semibold text-foreground w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* New row */}
                {newRow && (
                  <tr className="border-b border-border bg-accent/5">
                    {renderEditCells(newRow, setNewRow)}
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50 text-xs"
                          onClick={handleSaveNew}
                          disabled={addOrder.isPending}
                        >
                          {addOrder.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50 text-xs"
                          onClick={handleCancelNew}
                        >
                          ✕
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {/* Existing rows */}
                {orders && orders.length > 0 ? (
                  [...orders].reverse().map(([, order]) =>
                    editingId === order.id ? (
                      <tr key={String(order.id)} className="border-b border-border bg-accent/5">
                        {editRow && renderEditCells(editRow, setEditRow)}
                        <td className="px-2 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50 text-xs"
                              onClick={handleSaveEdit}
                              disabled={updateOrder.isPending}
                            >
                              {updateOrder.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50 text-xs"
                              onClick={handleCancelEdit}
                            >
                              ✕
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={String(order.id)}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-2.5 text-sm whitespace-nowrap">{nsToDateString(order.date)}</td>
                        <td className="px-3 py-2.5 text-sm">{String(order.bags)}</td>
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
                              onClick={() => handleEdit(order)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50 text-xs"
                              onClick={() => handleDelete(order.id)}
                              disabled={deleteOrder.isPending}
                            >
                              {deleteOrder.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  !newRow && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        No orders yet. Click "Add Order" to create one.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
