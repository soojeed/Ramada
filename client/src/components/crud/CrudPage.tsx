import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import toast from "react-hot-toast";
import type { ZodType } from "zod";
import { resource } from "../../api/resource.js";
import { getApiErrorMessage } from "../../api/client.js";
import { Button } from "../ui/Button.js";
import { Field, Input, Select, Textarea } from "../ui/Field.js";
import { Card, EmptyState, PageHeader, Spinner } from "../ui/Primitives.js";
import { ConfirmDialog, Modal } from "../ui/Modal.js";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface FieldOption {
  value: string | number;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "date" | "email";
  options?: FieldOption[];
  placeholder?: string;
  required?: boolean;
  step?: string;
}

interface CrudPageProps<T extends object> {
  title: string;
  subtitle?: string;
  resourcePath: string;
  idKey: keyof T & string;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  schema: ZodType;
  defaultValues?: FieldValues;
  searchKeys?: (keyof T & string)[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  toRowValues?: (row: T) => FieldValues;
  extraHeaderActions?: React.ReactNode;
  emptySubtitle?: string;
}

export function CrudPage<T extends object>({
  title,
  subtitle,
  resourcePath,
  idKey,
  columns,
  fields,
  schema,
  defaultValues = {},
  searchKeys = [],
  canCreate = true,
  canEdit = true,
  canDelete = true,
  toRowValues,
  extraHeaderActions,
  emptySubtitle,
}: CrudPageProps<T>) {
  const api = useMemo(() => resource<T>(resourcePath), [resourcePath]);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldValues>({ resolver: zodResolver(schema as never), defaultValues });

  async function load() {
    setLoading(true);
    try {
      const data = await api.list();
      setRows(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Xogta lama soo saari karin."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcePath]);

  function openCreate() {
    setEditing(null);
    reset(defaultValues);
    setModalOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    reset(toRowValues ? toRowValues(row) : (row as unknown as FieldValues));
    setModalOpen(true);
  }

  async function onSubmit(values: FieldValues) {
    setSaving(true);
    try {
      if (editing) {
        await api.update(editing[idKey] as number, values);
        toast.success("Si guul leh ayaa loo cusboonaysiiyay.");
      } else {
        await api.create(values);
        toast.success("Si guul leh ayaa loo daray.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await api.remove(deleting[idKey] as number);
      toast.success("Si guul leh ayaa loo tirtiray.");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  }

  const filtered = rows.filter((row) => {
    if (!search.trim() || searchKeys.length === 0) return true;
    const q = search.toLowerCase();
    return searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {extraHeaderActions}
            {canCreate && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Ku dar
              </Button>
            )}
          </>
        }
      />

      {searchKeys.length > 0 && (
        <div className="mb-4 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Raadi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState title="Wax lama helin" subtitle={emptySubtitle} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.label}
                    </th>
                  ))}
                  {(canEdit || canDelete) && <th className="px-4 py-3 text-right">Ficillo</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => (
                  <tr key={String(row[idKey])} className="hover:bg-gray-50/60">
                    {columns.map((c) => (
                      <td key={c.key} className={`px-4 py-3 text-ink-900 ${c.className ?? ""}`}>
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "-")}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(row)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleting(row)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${title}` : `Ku dar ${title}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {fields.map((f) => {
            const err = (errors as Record<string, { message?: string } | undefined>)[f.name];
            if (f.type === "select") {
              return (
                <Field key={f.name} label={f.label} required={f.required} error={err?.message}>
                  <Select {...register(f.name)} error={!!err}>
                    <option value="">-- Dooro --</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            }
            if (f.type === "textarea") {
              return (
                <Field key={f.name} label={f.label} required={f.required} error={err?.message}>
                  <Textarea {...register(f.name)} placeholder={f.placeholder} error={!!err} />
                </Field>
              );
            }
            return (
              <Field key={f.name} label={f.label} required={f.required} error={err?.message}>
                <Input
                  type={f.type ?? "text"}
                  step={f.step}
                  placeholder={f.placeholder}
                  error={!!err}
                  {...register(f.name)}
                />
              </Field>
            );
          })}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Jooji
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Kaydi" : "Ku dar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xaqiiji tirtiridda"
        message="Ma hubtaa inaad tirtirto xogtan? Tallaabadan lama celin karo."
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
