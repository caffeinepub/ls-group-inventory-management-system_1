import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PLANTS,
  type ToolRecord,
  branchBadgeClass,
  branchTabClass,
  useToolsStore,
} from "@/hooks/useInventoryStore";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditableToolRow {
  product: string;
  quantity: string;
  remarks: string;
}

function emptyToolRow(): EditableToolRow {
  return { product: "", quantity: "", remarks: "" };
}

function PlantTools({ plant }: { plant: string }) {
  const { getTools, addTool, updateTool, deleteTool, reorderTool } =
    useToolsStore();
  const [newRow, setNewRow] = useState<EditableToolRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<EditableToolRow | null>(null);
  const [saving, setSaving] = useState(false);

  const tools: ToolRecord[] = getTools(plant);

  const handleAddRow = () => setNewRow(emptyToolRow());

  const handleSaveNew = () => {
    if (!newRow) return;
    if (!newRow.product.trim() || !newRow.quantity.trim()) {
      toast.error("Product and Quantity are required");
      return;
    }
    setSaving(true);
    try {
      addTool({
        plant,
        product: newRow.product.trim(),
        quantity: newRow.quantity,
        remarks: newRow.remarks,
      });
      setNewRow(null);
      toast.success("Item saved");
    } catch {
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNew = () => setNewRow(null);

  const handleEdit = (tool: ToolRecord) => {
    setEditingId(tool.id);
    setEditRow({
      product: tool.product,
      quantity: tool.quantity,
      remarks: tool.remarks,
    });
  };

  const handleSaveEdit = () => {
    if (!editRow || !editingId) return;
    if (!editRow.quantity.trim()) {
      toast.error("Quantity is required");
      return;
    }
    setSaving(true);
    try {
      updateTool(editingId, {
        product: editRow.product.trim(),
        quantity: editRow.quantity,
        remarks: editRow.remarks,
      });
      setEditingId(null);
      setEditRow(null);
      toast.success("Item updated");
    } catch {
      toast.error("Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRow(null);
  };

  const handleDelete = (id: string) => {
    try {
      deleteTool(id);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const renderEditCells = (
    row: EditableToolRow,
    setRow: (r: EditableToolRow) => void,
  ) => (
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
    <div>
      <div className="flex justify-end px-4 pt-3 pb-2">
        <Button
          size="sm"
          onClick={handleAddRow}
          disabled={!!newRow}
          data-ocid="tools.open_modal_button"
          className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs font-semibold"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Item
        </Button>
      </div>
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
              <th className="text-left px-4 py-2.5 font-semibold text-foreground w-32">
                Quantity
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Remarks
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-20">
                Order
              </th>
              <th className="text-center px-4 py-2.5 font-semibold text-foreground w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {newRow && (
              <tr className="border-b border-border bg-accent/5">
                <td className="px-4 py-1.5 text-muted-foreground text-xs">—</td>
                {renderEditCells(newRow, setNewRow)}
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50"
                      onClick={handleSaveNew}
                      disabled={saving}
                      data-ocid="tools.save_button"
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
                      className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                      onClick={handleCancelNew}
                      data-ocid="tools.cancel_button"
                    >
                      ✕
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {tools.length > 0
              ? tools.map((tool, index) =>
                  editingId === tool.id ? (
                    <tr
                      key={tool.id}
                      className="border-b border-border bg-accent/5"
                      data-ocid={`tools.row.${index + 1}`}
                    >
                      <td className="px-4 py-1.5 text-muted-foreground text-xs">
                        {index + 1}
                      </td>
                      {editRow && renderEditCells(editRow, setEditRow)}
                      <td className="px-2 py-1.5" />
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 border-green-400 text-green-700 hover:bg-green-50"
                            onClick={handleSaveEdit}
                            disabled={saving}
                            data-ocid="tools.save_button"
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
                            className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                            onClick={handleCancelEdit}
                            data-ocid="tools.cancel_button"
                          >
                            ✕
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={tool.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                      data-ocid={`tools.row.${index + 1}`}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {tool.product}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">
                        {tool.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">
                        {tool.remarks}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => reorderTool(plant, tool.id, "up")}
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
                            disabled={index === tools.length - 1}
                            onClick={() => reorderTool(plant, tool.id, "down")}
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
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleEdit(tool)}
                            data-ocid={`tools.edit_button.${index + 1}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 border-red-400 text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(tool.id)}
                            data-ocid={`tools.delete_button.${index + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              : !newRow && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground text-sm"
                      data-ocid="tools.empty_state"
                    >
                      No items yet. Click "Add Item" to create one.
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ToolsMachineryTab() {
  const [activePlant, setActivePlant] = useState("ls-pulses");
  const currentPlant =
    PLANTS.find((p) => p.toLowerCase().replace(/\s+/g, "-") === activePlant) ??
    PLANTS[0];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Wrench className="w-5 h-5 text-accent" />
            Tools &amp; Machinery
          </CardTitle>
          <span
            className={`text-xs px-3 py-1 rounded-full ${branchBadgeClass(currentPlant)}`}
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
                  data-ocid="tools.tab"
                  className={`font-semibold ${branchTabClass(plant)}`}
                >
                  {plant}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {PLANTS.map((plant) => (
            <TabsContent
              key={plant}
              value={plant.toLowerCase().replace(/\s+/g, "-")}
              className="mt-0"
            >
              <PlantTools plant={plant} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
