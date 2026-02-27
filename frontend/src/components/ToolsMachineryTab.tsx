import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Loader2, Wrench, Save } from 'lucide-react';
import {
  useGetToolsMachinery,
  useAddToolMachinery,
  useUpdateToolMachinery,
  useDeleteToolMachinery,
} from '@/hooks/useQueries';
import { toast } from 'sonner';

interface EditableToolRow {
  product: string;
  quantity: string;
  remarks: string;
}

function emptyToolRow(): EditableToolRow {
  return { product: '', quantity: '', remarks: '' };
}

export default function ToolsMachineryTab() {
  const { data: tools, isLoading } = useGetToolsMachinery();
  const addTool = useAddToolMachinery();
  const updateTool = useUpdateToolMachinery();
  const deleteTool = useDeleteToolMachinery();

  const [newRow, setNewRow] = useState<EditableToolRow | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<EditableToolRow | null>(null);

  const handleAddRow = () => setNewRow(emptyToolRow());

  const handleSaveNew = async () => {
    if (!newRow) return;
    const qty = parseInt(newRow.quantity, 10);
    if (!newRow.product || isNaN(qty)) {
      toast.error('Product and Quantity are required');
      return;
    }
    try {
      await addTool.mutateAsync({
        product: newRow.product,
        quantity: BigInt(qty),
        remarks: newRow.remarks,
      });
      setNewRow(null);
      toast.success('Item added');
    } catch {
      toast.error('Failed to add item');
    }
  };

  const handleCancelNew = () => setNewRow(null);

  const handleEdit = (index: number) => {
    if (!tools) return;
    const t = tools[index];
    setEditingIndex(index);
    setEditRow({ product: t.product, quantity: String(t.quantity), remarks: t.remarks });
  };

  const handleSaveEdit = async () => {
    if (editRow === null || editingIndex === null) return;
    const qty = parseInt(editRow.quantity, 10);
    if (isNaN(qty)) {
      toast.error('Quantity must be a number');
      return;
    }
    try {
      await updateTool.mutateAsync({
        index: BigInt(editingIndex),
        quantity: BigInt(qty),
        remarks: editRow.remarks,
      });
      setEditingIndex(null);
      setEditRow(null);
      toast.success('Item updated');
    } catch {
      toast.error('Failed to update item');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditRow(null);
  };

  const handleDelete = async (index: number) => {
    try {
      await deleteTool.mutateAsync(BigInt(index));
      toast.success('Item deleted');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const renderEditCells = (row: EditableToolRow, setRow: (r: EditableToolRow) => void) => (
    <>
      <td className="px-2 py-1.5">
        <Input
          placeholder="Product"
          value={row.product}
          onChange={(e) => setRow({ ...row, product: e.target.value })}
          className="h-8 text-xs w-40"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          type="number"
          min="0"
          step="1"
          placeholder="Qty"
          value={row.quantity}
          onChange={(e) => setRow({ ...row, quantity: e.target.value })}
          className="h-8 text-xs w-24"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          placeholder="Remarks"
          value={row.remarks}
          onChange={(e) => setRow({ ...row, remarks: e.target.value })}
          className="h-8 text-xs w-48"
        />
      </td>
    </>
  );

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Wrench className="w-5 h-5 text-accent" />
            Tools &amp; Machinery
          </CardTitle>
          <Button
            size="sm"
            onClick={handleAddRow}
            disabled={!!newRow}
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs font-semibold"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Item
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
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground w-8">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Product</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground w-32">Quantity</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Remarks</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-foreground w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {newRow && (
                  <tr className="border-b border-border bg-accent/5">
                    <td className="px-4 py-1.5 text-muted-foreground text-xs">—</td>
                    {renderEditCells(newRow, setNewRow)}
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50"
                          onClick={handleSaveNew}
                          disabled={addTool.isPending}
                        >
                          {addTool.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                          onClick={handleCancelNew}
                        >
                          ✕
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {tools && tools.length > 0 ? (
                  tools.map((tool, index) =>
                    editingIndex === index ? (
                      <tr key={index} className="border-b border-border bg-accent/5">
                        <td className="px-4 py-1.5 text-muted-foreground text-xs">{index + 1}</td>
                        {editRow && renderEditCells(editRow, setEditRow)}
                        <td className="px-2 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50"
                              onClick={handleSaveEdit}
                              disabled={updateTool.isPending}
                            >
                              {updateTool.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                              onClick={handleCancelEdit}
                            >
                              ✕
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={index}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{index + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">{tool.product}</td>
                        <td className="px-4 py-2.5 text-foreground">{String(tool.quantity)}</td>
                        <td className="px-4 py-2.5 text-foreground">{tool.remarks}</td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleEdit(index)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(index)}
                              disabled={deleteTool.isPending}
                            >
                              {deleteTool.isPending ? (
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
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        No items yet. Click "Add Item" to create one.
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
