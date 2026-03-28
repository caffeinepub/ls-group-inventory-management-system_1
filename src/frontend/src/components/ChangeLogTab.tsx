import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChangeLog } from "@/hooks/useChangeLog";
import { History } from "lucide-react";

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${min}`;
}

/** Color badge for Bardana column name */
function ColumnBadge({ column }: { column: string }) {
  const colorMap: Record<string, string> = {
    "Initial Stock": "bg-blue-100 text-blue-800 border-blue-300",
    "Added Bardana": "bg-amber-100 text-amber-800 border-amber-300",
    "Current Stock": "bg-green-100 text-green-800 border-green-300",
  };
  const cls = colorMap[column] ?? "bg-gray-100 text-gray-700 border-gray-300";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}
    >
      {column}
    </span>
  );
}

export default function ChangeLogTab() {
  const { getInventoryLog, getBardanaLog } = useChangeLog();
  const inventoryLogs = getInventoryLog();
  const bardanaLogs = getBardanaLog();

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <History className="w-5 h-5 text-accent" />
          Change Log
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (Last 5 days · Read-only)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="inventory">
          <TabsList className="w-full rounded-none border-b border-border bg-muted/40 h-10">
            {/* Inventory tab - blue color coding */}
            <TabsTrigger
              value="inventory"
              className="flex-1 text-sm font-semibold
                data-[state=active]:bg-blue-600 data-[state=active]:text-white
                data-[state=active]:shadow-sm
                text-blue-700 hover:text-blue-800"
            >
              📊 Inventory
            </TabsTrigger>
            {/* Bardana tab - amber/orange color coding */}
            <TabsTrigger
              value="bardana"
              className="flex-1 text-sm font-semibold
                data-[state=active]:bg-amber-500 data-[state=active]:text-white
                data-[state=active]:shadow-sm
                text-amber-700 hover:text-amber-800"
            >
              📦 Bardana
            </TabsTrigger>
          </TabsList>

          {/* Inventory Sub-Tab */}
          <TabsContent value="inventory" className="mt-0">
            <div className="bg-blue-50/40 px-4 py-1.5 border-b border-blue-100">
              <span className="text-xs text-blue-700 font-medium">
                Showing inventory stock changes for the last 5 days
              </span>
            </div>
            <div className="overflow-auto h-[540px]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50 border-b border-blue-200 backdrop-blur-sm">
                    <th className="text-left px-4 py-2.5 font-semibold text-blue-900 whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-blue-900 whitespace-nowrap">
                      Plant
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-blue-900 whitespace-nowrap">
                      Product Name
                    </th>
                    <th className="text-center px-4 py-2.5 font-semibold text-blue-900 whitespace-nowrap">
                      Qty Change
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-blue-900 whitespace-nowrap">
                      User ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLogs.length > 0 ? (
                    inventoryLogs.map((log) => {
                      const isPositive = log.qtyChange > 0;
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-border hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-sm font-mono text-muted-foreground whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-4 py-2.5 text-sm whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="text-xs font-medium"
                            >
                              {log.plant}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-foreground whitespace-nowrap">
                            {log.product}
                          </td>
                          <td className="px-4 py-2.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-bold ${
                                isPositive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {log.qtyChange}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground capitalize whitespace-nowrap">
                            {log.userId}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-muted-foreground text-sm"
                      >
                        No inventory changes in the past 5 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Bardana Sub-Tab */}
          <TabsContent value="bardana" className="mt-0">
            <div className="bg-amber-50/60 px-4 py-1.5 border-b border-amber-100">
              <span className="text-xs text-amber-700 font-medium">
                Showing bardana changes (Initial Stock, Added Bardana, Current
                Stock) for the last 5 days
              </span>
            </div>
            <div className="overflow-auto h-[540px]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-amber-50 border-b border-amber-200 backdrop-blur-sm">
                    <th className="text-left px-4 py-2.5 font-semibold text-amber-900 whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-amber-900 whitespace-nowrap">
                      Plant
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-amber-900 whitespace-nowrap">
                      Product Name
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-amber-900 whitespace-nowrap">
                      Column
                    </th>
                    <th className="text-center px-4 py-2.5 font-semibold text-amber-900 whitespace-nowrap">
                      Previous Qty
                    </th>
                    <th className="text-center px-4 py-2.5 font-semibold text-amber-900 whitespace-nowrap">
                      New Qty
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-amber-900 whitespace-nowrap">
                      User ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bardanaLogs.length > 0 ? (
                    bardanaLogs.map((log) => {
                      const increased = log.newQty > log.previousQty;
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-border hover:bg-amber-50/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-sm font-mono text-muted-foreground whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-4 py-2.5 text-sm whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="text-xs font-medium"
                            >
                              {log.plant}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-foreground whitespace-nowrap">
                            {log.product}
                          </td>
                          <td className="px-4 py-2.5 text-sm whitespace-nowrap">
                            <ColumnBadge
                              column={log.column ?? "Initial Stock"}
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center text-sm tabular-nums text-muted-foreground whitespace-nowrap">
                            {log.previousQty}
                          </td>
                          <td className="px-4 py-2.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-bold ${
                                increased
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.newQty}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground capitalize whitespace-nowrap">
                            {log.userId}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-muted-foreground text-sm"
                      >
                        No bardana changes in the past 5 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
