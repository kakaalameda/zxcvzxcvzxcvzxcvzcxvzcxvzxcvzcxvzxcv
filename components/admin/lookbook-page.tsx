"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AdminLookbookSection } from "@/lib/repositories/admin-lookbook";
import type { AdminProductRecord } from "@/lib/repositories/admin-products";

interface LookbookPageProps {
  initialSections: AdminLookbookSection[];
  products: Pick<AdminProductRecord, "id" | "name" | "subtitle">[];
}

function buildDefault(section?: AdminLookbookSection) {
  return {
    eyebrow: section?.eyebrow ?? "",
    title: section?.title ?? "",
    text: section?.text ?? "",
    productId: section?.productId ?? null,
    sortOrder: section?.sortOrder ?? 0,
    active: section?.active ?? true,
  };
}

export function LookbookPage({ initialSections, products }: LookbookPageProps) {
  const [sections, setSections] = useState(initialSections);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminLookbookSection | null>(null);
  const [values, setValues] = useState(buildDefault());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openForm = (section: AdminLookbookSection | null) => {
    setEditing(section);
    setValues(buildDefault(section ?? undefined));
    setError(null);
    setMessage(null);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      setMessage(null);

      const url = editing
        ? `/api/admin/lookbook/${editing.id}`
        : "/api/admin/lookbook";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(result?.error ?? "Không thể lưu section.");
        return;
      }

      setMessage(editing ? "Đã cập nhật." : "Đã tạo section.");
      window.location.reload();
    });
  };

  const handleDelete = (section: AdminLookbookSection) => {
    if (!window.confirm(`Xác nhận xoá "${section.title}"?`)) return;
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/admin/lookbook/${section.id}`, { method: "DELETE" });
      if (!res.ok) {
        const result = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Không thể xoá.");
        return;
      }
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      setMessage("Đã xoá section.");
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-4xl space-y-4">

        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gold-500">Admin</p>
              <h1 className="mt-3 font-display text-4xl tracking-wide">Lookbook</h1>
              <p className="mt-2 text-sm text-white/55">
                Quản lý các section editorial trên trang Lookbook.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => openForm(null)}>
              <Plus className="size-4" />
              Thêm section
            </Button>
          </div>
        </div>

        {message && (
          <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Sections list */}
        <div className="space-y-3">
          {sections.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-white/40">
              Chưa có section nào. Thêm section đầu tiên.
            </div>
          )}
          {sections.map((section) => {
            const linkedProduct = products.find((p) => p.id === section.productId);
            return (
              <div
                key={section.id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-5 py-4"
              >
                <GripVertical className="size-4 flex-shrink-0 text-white/20" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gold-500 font-heading tracking-widest uppercase">
                      {section.eyebrow || "—"}
                    </p>
                    <span className={cn(
                      "inline-flex rounded-full px-2 py-0.5 size-micro font-medium",
                      section.active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/40"
                    )}>
                      {section.active ? "Hiển thị" : "Ẩn"}
                    </span>
                  </div>
                  <p className="mt-0.5 font-heading font-bold tracking-wide">{section.title}</p>
                  <p className="mt-0.5 text-xs text-white/40 line-clamp-1">{section.text}</p>
                  {linkedProduct ? (
                    <p className="mt-1 text-xs text-white/30">
                      Sản phẩm: <span className="text-white/60">{linkedProduct.name}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-400/60">Chưa gán sản phẩm</p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openForm(section)}>
                    <Pencil className="size-4" />
                    Sửa
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(section)}>
                    <Trash2 className="size-4" />
                    Xoá
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlay */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeForm} />
      )}

      {/* Slide-over drawer */}
      <div className={[
        "fixed right-0 top-0 h-full w-full max-w-[520px] bg-[#0c0c0c] border-l border-white/10 z-50 overflow-y-auto",
        "transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        formOpen ? "translate-x-0" : "translate-x-full",
      ].join(" ")}>
        <div className="p-6 space-y-6">
          {/* Drawer header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gold-500">
                {editing ? "Chỉnh sửa" : "Thêm mới"}
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-wide">
                {editing ? editing.title : "Section mới"}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/15 transition-all cursor-pointer bg-transparent rounded-sm"
              aria-label="Đóng"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lb-eyebrow">Eyebrow (VD: Editorial 01)</Label>
              <Input
                id="lb-eyebrow"
                placeholder="Editorial 01"
                value={values.eyebrow}
                onChange={(e) => setValues((v) => ({ ...v, eyebrow: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lb-title">Tiêu đề *</Label>
              <Input
                id="lb-title"
                required
                placeholder="Concrete Morning"
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lb-text">Mô tả</Label>
              <Textarea
                id="lb-text"
                rows={4}
                placeholder="Đoạn văn mô tả phong cách editorial..."
                value={values.text}
                onChange={(e) => setValues((v) => ({ ...v, text: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lb-product">Sản phẩm liên kết</Label>
              <select
                id="lb-product"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={values.productId ?? ""}
                onChange={(e) => setValues((v) => ({
                  ...v,
                  productId: e.target.value ? Number(e.target.value) : null,
                }))}
              >
                <option value="" className="bg-black text-white">— Chưa gán sản phẩm —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-black text-white">
                    {p.name} — {p.subtitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lb-sort">Thứ tự</Label>
                <Input
                  id="lb-sort"
                  type="number"
                  min={0}
                  value={values.sortOrder}
                  onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.active}
                    onChange={(e) => setValues((v) => ({ ...v, active: e.target.checked }))}
                  />
                  Hiển thị trên web
                </label>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="flex gap-3 pb-2">
              <Button
                type="submit"
                className="bg-gold-500 text-black hover:bg-gold-400"
                disabled={isPending}
              >
                {isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo section"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Huỷ
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
