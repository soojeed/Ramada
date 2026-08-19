import { useEffect, useState } from "react";
import { Wallet, Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../api/client.js";
import { resource } from "../../api/resource.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input, Select } from "../../components/ui/Field.js";
import { ConfirmDialog, Modal } from "../../components/ui/Modal.js";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { dateOnly, money, toDateInputValue } from "../../lib/format.js";
import type { SalaryAdvance, Staff } from "../../types/index.js";

const staffsApi = resource<Staff>("/staffs");

interface StaffForm {
  fullName: string;
  position: string;
  phone: string;
  gender: string;
  salary: string;
  hireDate: string;
}

const emptyForm: StaffForm = { fullName: "", position: "", phone: "", gender: "", salary: "", hireDate: "" };

export default function StaffsPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Staff | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [advanceStaff, setAdvanceStaff] = useState<Staff | null>(null);
  const [advanceHistory, setAdvanceHistory] = useState<SalaryAdvance[]>([]);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceType, setAdvanceType] = useState<"Advance" | "Salary">("Advance");
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advanceSaving, setAdvanceSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setStaffs(await staffsApi.list());
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(s: Staff) {
    setEditing(s);
    setForm({
      fullName: s.fullName,
      position: s.position ?? "",
      phone: s.phone ?? "",
      gender: s.gender ?? "",
      salary: String(s.salary),
      hireDate: toDateInputValue(s.hireDate),
    });
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary) };
      if (editing) {
        await staffsApi.update(editing.staffId, payload);
        toast.success("Staff si guul leh ayaa loo cusboonaysiiyay.");
      } else {
        await staffsApi.create(payload);
        toast.success("Staff si guul leh ayaa loo daray.");
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
      await staffsApi.remove(deleting.staffId);
      toast.success("Staff si guul leh ayaa loo tirtiray.");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  }

  async function openAdvance(s: Staff) {
    setAdvanceStaff(s);
    setAdvanceAmount("");
    setAdvanceType("Advance");
    setAdvanceNotes("");
    try {
      const res = await api.get<{ success: boolean; data: Staff & { salaryAdvances: SalaryAdvance[] } }>(
        `/staffs/${s.staffId}`
      );
      setAdvanceHistory(res.data.data.salaryAdvances ?? []);
    } catch {
      setAdvanceHistory([]);
    }
  }

  async function submitAdvance() {
    if (!advanceStaff) return;
    setAdvanceSaving(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/staffs/${advanceStaff.staffId}/advance`, {
        amount: Number(advanceAmount),
        paymentType: advanceType,
        notes: advanceNotes,
      });
      toast.success(res.data.message);
      openAdvance(advanceStaff);
      setAdvanceAmount("");
      setAdvanceNotes("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setAdvanceSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Staffs"
        subtitle="Maamul shaqaalaha hotel-ka, mushaharka iyo advances-ka."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Ku dar Staff
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : staffs.length === 0 ? (
          <EmptyState title="Staff lama helin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Hire Date</th>
                  <th className="px-4 py-3 text-right">Ficillo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffs.map((s) => (
                  <tr key={s.staffId} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">{s.fullName}</td>
                    <td className="px-4 py-3">{s.position ?? "-"}</td>
                    <td className="px-4 py-3">{s.phone ?? "-"}</td>
                    <td className="px-4 py-3">{money(s.salary)}</td>
                    <td className="px-4 py-3">{dateOnly(s.hireDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openAdvance(s)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                          title="Advance / Salary"
                        >
                          <Wallet className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(s)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Staff" : "Ku dar Staff"}>
        <div className="flex flex-col gap-4">
          <Field label="Full Name" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Position">
            <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">-- Dooro --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary" required>
              <Input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </Field>
            <Field label="Hire Date" required>
              <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
            </Field>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Jooji
            </Button>
            <Button onClick={submit} loading={saving}>
              Kaydi
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!advanceStaff}
        onClose={() => setAdvanceStaff(null)}
        title={`Advance / Salary — ${advanceStaff?.fullName ?? ""}`}
        width="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount" required>
              <Input type="number" step="0.01" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
            </Field>
            <Field label="Type">
              <Select value={advanceType} onChange={(e) => setAdvanceType(e.target.value as "Advance" | "Salary")}>
                <option value="Advance">Advance</option>
                <option value="Salary">Salary</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Input value={advanceNotes} onChange={(e) => setAdvanceNotes(e.target.value)} />
          </Field>
          <Button onClick={submitAdvance} loading={advanceSaving} className="self-end">
            Diiwaan geli
          </Button>

          <div className="mt-2 border-t border-gray-100 pt-3">
            <p className="mb-2 text-sm font-medium text-ink-900">Taariikhda</p>
            {advanceHistory.length === 0 ? (
              <p className="text-sm text-gray-400">Wax taariikh ah lama helin.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {advanceHistory.map((a) => (
                  <div key={a.salaryAdvanceId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-ink-900">{money(a.amount)}</span>{" "}
                      <Badge>{a.paymentType ?? "-"}</Badge>
                    </div>
                    <span className="text-xs text-gray-400">{dateOnly(a.paymentDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xaqiiji tirtiridda"
        message="Ma hubtaa inaad tirtirto staff-kan?"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
