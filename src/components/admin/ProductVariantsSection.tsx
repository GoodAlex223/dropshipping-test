"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VARIANT_NAMES } from "@/lib/variant-names";

type VariantName = (typeof VARIANT_NAMES)[keyof typeof VARIANT_NAMES];
const NAME_OPTIONS: VariantName[] = [VARIANT_NAMES.size, VARIANT_NAMES.color];

interface VariantRow {
  id: string;
  name: string;
  value: string;
  stock: number;
}

interface ProductVariantsSectionProps {
  productId: string;
}

/**
 * G16: name → value → stock rows over /api/admin/products/[id]/variants.
 * The name control is a Select over VARIANT_NAMES — never free text — so a
 * hand-typed "Size" (which breaks every storefront lookup) is unenterable.
 * Value/stock edits persist on blur via PATCH; per-variant price/sku are
 * deliberately not exposed (YAGNI).
 */
export function ProductVariantsSection({ productId }: ProductVariantsSectionProps) {
  const t = useTranslations("admin.productVariants");
  const tCommon = useTranslations("admin.common");
  const base = `/api/admin/products/${productId}/variants`;

  const [rows, setRows] = useState<VariantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: VariantName; value: string; stock: string }>({
    name: VARIANT_NAMES.size,
    value: "",
    stock: "0",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(base);
        if (!res.ok) throw new Error();
        setRows(await res.json());
      } catch {
        toast.error(t("toasts.loadError"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [base, t]);

  const addVariant = async () => {
    const stock = parseInt(draft.stock, 10);
    if (!draft.value.trim() || isNaN(stock) || stock < 0) return;
    setBusyId("new");
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, value: draft.value.trim(), stock }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("toasts.saveError"));
      }
      const created: VariantRow = await res.json();
      setRows((prev) => [...prev, created]);
      setDraft({ name: draft.name, value: "", stock: "0" });
      toast.success(t("toasts.added"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toasts.saveError"));
    } finally {
      setBusyId(null);
    }
  };

  const patchVariant = useCallback(
    async (id: string, patch: Partial<Pick<VariantRow, "name" | "value" | "stock">>) => {
      setBusyId(id);
      try {
        const res = await fetch(`${base}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t("toasts.saveError"));
        }
        const updated: VariantRow = await res.json();
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
        toast.success(t("toasts.updated"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("toasts.saveError"));
      } finally {
        setBusyId(null);
      }
    },
    [base, t]
  );

  const deleteVariant = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${base}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("toasts.deleteError"));
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("toasts.deleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toasts.deleteError"));
    } finally {
      setBusyId(null);
    }
  };

  const updateLocal = (id: string, patch: Partial<VariantRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const nameSelect = (value: string, onChange: (v: VariantName) => void, disabled: boolean) => (
    <Select value={value} onValueChange={(v) => onChange(v as VariantName)} disabled={disabled}>
      <SelectTrigger aria-label={t("headers.name")}>
        <SelectValue placeholder={t("namePlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {NAME_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> {tCommon("loading")}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <div className="space-y-2">
            <div className="text-muted-foreground grid grid-cols-[1fr_1fr_6rem_2.5rem] gap-2 text-xs font-medium">
              <span>{t("headers.name")}</span>
              <span>{t("headers.value")}</span>
              <span>{t("headers.stock")}</span>
              <span className="sr-only">{t("headers.actions")}</span>
            </div>
            {rows.map((row) => {
              const busy = busyId === row.id;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_6rem_2.5rem] items-center gap-2"
                >
                  {nameSelect(row.name, (name) => patchVariant(row.id, { name }), busy)}
                  <Input
                    aria-label={t("headers.value")}
                    value={row.value}
                    disabled={busy}
                    onChange={(e) => updateLocal(row.id, { value: e.target.value })}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value) patchVariant(row.id, { value });
                    }}
                  />
                  <Input
                    aria-label={t("headers.stock")}
                    type="number"
                    min="0"
                    value={row.stock}
                    disabled={busy}
                    onChange={(e) => updateLocal(row.id, { stock: Number(e.target.value) })}
                    onBlur={(e) => {
                      const stock = parseInt(e.target.value, 10);
                      if (!isNaN(stock) && stock >= 0) patchVariant(row.id, { stock });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={tCommon("delete")}
                    disabled={busy}
                    onClick={() => deleteVariant(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-[1fr_1fr_6rem_auto] items-center gap-2 border-t pt-4">
          {nameSelect(draft.name, (name) => setDraft({ ...draft, name }), busyId === "new")}
          <Input
            aria-label={t("headers.value")}
            placeholder={t("valuePlaceholder")}
            value={draft.value}
            disabled={busyId === "new"}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          />
          <Input
            aria-label={t("headers.stock")}
            type="number"
            min="0"
            value={draft.stock}
            disabled={busyId === "new"}
            onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
          />
          <Button
            type="button"
            onClick={addVariant}
            disabled={busyId === "new" || !draft.value.trim()}
          >
            {busyId === "new" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("add")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
