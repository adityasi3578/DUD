import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MobileTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
  renderMobileCard: (item: any, index: number) => ReactNode;
}

export function MobileResponsiveTable({ headers, data, renderRow, renderMobileCard }: MobileTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {headers.map((header, index) => (
                  <th key={index} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => renderRow(item, index))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {data.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              {renderMobileCard(item, index)}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}