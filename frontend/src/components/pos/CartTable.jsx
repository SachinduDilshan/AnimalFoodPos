import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductCell } from "@/components/pos/ProductCell";
import { computeLineTotal } from "@/lib/billCalculations";
import { formatRupees } from "@/lib/currency";

const COLUMN_COUNT = 6;

function discountLabel(line) {
  if (line.discountType === "PERCENT") return `${line.discountValue}%`;
  if (line.discountType === "FLAT") return formatRupees(line.discountValue);
  return "—";
}

export function CartTable({ lines, onEditLine, onRemoveLine }) {
  return (
    <Card className="flex h-[80vh] flex-col">
      <CardHeader>
        <CardTitle>Cart</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Product</TableHead>
              <TableHead className="text-left w-20">Qty</TableHead>
              <TableHead className="text-left w-32">Rate</TableHead>
              <TableHead className="text-left w-32">Discount</TableHead>
              <TableHead className="text-left">Line Total</TableHead>
              <TableHead className="text-center w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-6 text-center text-muted-foreground"
                >
                  Cart is empty — scan or search for an item above.
                </TableCell>
              </TableRow>
            )}

            {lines.map((line) => {
              const { lineTotal } = computeLineTotal(line);

              return (
                <TableRow key={line.itemId} data-row-id={line.itemId}>
                  <TableCell>
                    <ProductCell item={line.item} />
                  </TableCell>
                  <TableCell className="text-left">{line.qty}</TableCell>
                  <TableCell className="text-left">{formatRupees(line.rate)}</TableCell>
                  <TableCell className="text-left">{discountLabel(line)}</TableCell>
                  <TableCell className="text-left">{formatRupees(lineTotal)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${line.item.name}`}
                        onClick={() => onEditLine(line)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${line.item.name}`}
                        onClick={() => onRemoveLine(line.itemId)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
