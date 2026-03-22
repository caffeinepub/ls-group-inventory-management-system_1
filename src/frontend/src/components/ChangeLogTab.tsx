import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetChangeLog } from "@/hooks/useQueries";
import { formatIST } from "@/lib/dateUtils";
import { History } from "lucide-react";

export default function ChangeLogTab() {
  const { data: logs, isLoading } = useGetChangeLog();

  // Sort by timestamp descending (newest first)
  const sortedLogs = logs
    ? [...logs].sort(([, a], [, b]) => {
        if (a.timestamp > b.timestamp) return -1;
        if (a.timestamp < b.timestamp) return 1;
        return 0;
      })
    : [];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <History className="w-5 h-5 text-accent" />
          Change Log
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (Last 3 days · Read-only)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
              <Skeleton key={k} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/80 border-b border-border backdrop-blur-sm">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                      Date &amp; Time (IST)
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                      Plant
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                      Product
                    </th>
                    <th className="text-center px-4 py-2.5 font-semibold text-foreground w-36">
                      Qty Change
                    </th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground w-28">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.length > 0 ? (
                    sortedLogs.map(([id, log]) => {
                      const change = Number(log.quantityChange);
                      const isPositive = change > 0;
                      return (
                        <tr
                          key={String(id)}
                          className="border-b border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-sm font-mono text-muted-foreground whitespace-nowrap">
                            {formatIST(log.timestamp)}
                          </td>
                          <td className="px-4 py-2.5 text-sm">
                            <Badge
                              variant="outline"
                              className="text-xs font-medium"
                            >
                              {log.plant}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                            {log.product}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-bold ${
                                isPositive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {change}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground capitalize">
                            {log.user}
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
                        No change log entries in the past 3 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
