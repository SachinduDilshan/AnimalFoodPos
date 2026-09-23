import { useEffect, useRef, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeLineTotal } from "@/lib/billCalculations";
import { formatRupees } from "@/lib/currency";

const COLUMN_COUNT = 8;

// select.jsx's SelectTrigger/input.jsx's Input aren't forwardRef-wrapped (same issue as
// command.jsx's CommandInput), so a `ref` prop on them silently does nothing — query the
// actual DOM nodes by data attribute within this row instead, same workaround as there.
function focusField(container, itemId, field) {
  const el = container?.querySelector(
    `[data-row-id="${itemId}"] [data-field="${field}"]`,
  );
  el?.focus();
  el?.select?.();
}

export function CartTable({
  lines,
  onUpdateLine,
  onRemoveLine,
  focusRequest,
  onFocusSearch,
}) {
  const containerRef = useRef(null);
  const [pendingDiscountFocus, setPendingDiscountFocus] = useState(null);

  // Newly added (or re-scanned/merged) item: jump focus to its qty field so the cashier
  // can immediately correct it without reaching for the mouse.
  useEffect(() => {
    if (!focusRequest) return;
    focusField(containerRef.current, focusRequest.itemId, "qty");
  }, [focusRequest]);

  // Deferred one render so the discount-value input has already re-enabled (or, for NONE,
  // so we skip it and go straight back to search) before we try to focus it.
  useEffect(() => {
    if (!pendingDiscountFocus) return;
    const line = lines.find((l) => l.itemId === pendingDiscountFocus.itemId);
    if (!line) return;
    if (line.discountType === "NONE") {
      onFocusSearch();
    } else {
      focusField(
        containerRef.current,
        pendingDiscountFocus.itemId,
        "discount-value",
      );
    }
    setPendingDiscountFocus(null);
  }, [lines, pendingDiscountFocus, onFocusSearch]);

  function handleFieldKeyDown(e, itemId, nextField) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (nextField) {
      focusField(containerRef.current, itemId, nextField);
    } else {
      onFocusSearch();
    }
  }

  return (
    <div ref={containerRef}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-32">Code</TableHead>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-center">Unit</TableHead>
            <TableHead className="text-left w-20">Qty</TableHead>
            <TableHead className="text-left w-48">Rate</TableHead>
            <TableHead className="text-left w-52">Discount</TableHead>
            <TableHead className="text-left">Line Total</TableHead>
            <TableHead className="text-center">Remove</TableHead>
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
            const isKg = line.item.unit === "KG";
            const step = isKg ? "0.01" : "1";

            return (
              <TableRow key={line.itemId} data-row-id={line.itemId}>
                <TableCell className="font-mono text-xs">
                  {line.item.code}
                </TableCell>
                <TableCell className="text-left">{line.item.name}</TableCell>
                <TableCell className="text-center">{line.item.unit}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step={step}
                    min={step}
                    value={line.qty}
                    className="w-20"
                    data-field="qty"
                    onChange={(e) =>
                      onUpdateLine(line.itemId, { qty: Number(e.target.value) })
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(e, line.itemId, "rate")
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.rate}
                    className="w-full"
                    data-field="rate"
                    onChange={(e) =>
                      onUpdateLine(line.itemId, {
                        rate: Number(e.target.value),
                      })
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(e, line.itemId, "discount-type")
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex text-center items-center gap-1">
                    <Select
                      value={line.discountType}
                      onValueChange={(value) => {
                        onUpdateLine(line.itemId, {
                          discountType: value,
                          discountValue: 0,
                        });
                        setPendingDiscountFocus({ itemId: line.itemId });
                      }}
                    >
                      <SelectTrigger
                        className="w-24"
                        data-field="discount-type"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      {/*
                        Radix restores focus to the trigger when the popup closes, which fires
                        after (and overrides) the pendingDiscountFocus effect's own focus call
                        below — opt out of that default so our explicit focus wins.
                      */}
                      <SelectContent
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="FLAT">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={line.discountType === "PERCENT" ? "100" : undefined}
                      disabled={line.discountType === "NONE"}
                      value={line.discountValue}
                      className="w-20"
                      data-field="discount-value"
                      onChange={(e) =>
                        onUpdateLine(line.itemId, {
                          discountValue: Number(e.target.value),
                        })
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(e, line.itemId, null)
                      }
                    />
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  {formatRupees(lineTotal)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${line.item.name}`}
                    onClick={() => onRemoveLine(line.itemId)}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
