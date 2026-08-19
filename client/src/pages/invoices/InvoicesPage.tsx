import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../api/client.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input, Select } from "../../components/ui/Field.js";
import { ConfirmDialog, Modal } from "../../components/ui/Modal.js";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { dateOnly, money } from "../../lib/format.js";
import type { Booking, Invoice } from "../../types/index.js";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"booking" | "walkin">("booking");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInRoomCharge, setWalkInRoomCharge] = useState("0");
  const [walkInFoodCharge, setWalkInFoodCharge] = useState("0");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [inv, bk] = await Promise.all([
        api.get<{ success: boolean; data: Invoice[] }>("/invoices"),
        api.get<{ success: boolean; data: Booking[] }>("/bookings", { params: { search: "" } }),
      ]);
      setInvoices(inv.data.data);
      setBookings(bk.data.data);
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
    setMode("booking");
    setSelectedBookingId("");
    setWalkInName("");
    setWalkInRoomCharge("0");
    setWalkInFoodCharge("0");
    setModalOpen(true);
  }

  async function submit() {
    setSaving(true);
    try {
      if (mode === "booking") {
        if (!selectedBookingId) {
          toast.error("Fadlan dooro Booking.");
          setSaving(false);
          return;
        }
        await api.post(`/invoices/from-booking/${selectedBookingId}`);
      } else {
        if (!walkInName.trim()) {
          toast.error("Fadlan geli magaca customer-ka.");
          setSaving(false);
          return;
        }
        await api.post("/invoices/walk-in", {
          walkInCustomerName: walkInName,
          totalRoomCharge: Number(walkInRoomCharge),
          totalFoodCharge: Number(walkInFoodCharge),
        });
      }
      toast.success("Invoice si guul leh ayaa loo diyaariyay.");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(inv: Invoice) {
    try {
      await api.post(`/invoices/${inv.invoiceId}/mark-paid`);
      toast.success("Invoice waa la calaamadiyay Paid.");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await api.delete(`/invoices/${deleting.invoiceId}`);
      toast.success("Invoice si guul leh ayaa loo tirtiray.");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Diyaari qaansheegyada guud ee martida — room + food charges."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Invoice Cusub
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : invoices.length === 0 ? (
          <EmptyState title="Invoice lama helin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Room Charge</th>
                  <th className="px-4 py-3">Food Charge</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ficillo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {inv.guest?.fullName ?? inv.walkInCustomerName ?? `Booking #${inv.bookingId}`}
                    </td>
                    <td className="px-4 py-3">{money(inv.totalRoomCharge)}</td>
                    <td className="px-4 py-3">{money(inv.totalFoodCharge)}</td>
                    <td className="px-4 py-3 font-medium">{money(inv.grandTotal)}</td>
                    <td className="px-4 py-3">{dateOnly(inv.invoiceDate)}</td>
                    <td className="px-4 py-3">
                      <Badge>{inv.isPaid ? "Paid" : "Pending"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {!inv.isPaid && (
                          <button
                            onClick={() => markPaid(inv)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Mark Paid"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleting(inv)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Invoice Cusub">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("booking")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${mode === "booking" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}
            >
              Ka samee Booking
            </button>
            <button
              type="button"
              onClick={() => setMode("walkin")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${mode === "walkin" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}
            >
              Walk-in Customer
            </button>
          </div>

          {mode === "booking" ? (
            <Field label="Booking" required>
              <Select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)}>
                <option value="">-- Dooro Booking --</option>
                {bookings.map((b) => (
                  <option key={b.bookingId} value={b.bookingId}>
                    #{b.bookingId} — {b.guest?.fullName} ({money(b.finalAmount)})
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <>
              <Field label="Customer Name" required>
                <Input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room Charge">
                  <Input type="number" step="0.01" value={walkInRoomCharge} onChange={(e) => setWalkInRoomCharge(e.target.value)} />
                </Field>
                <Field label="Food Charge">
                  <Input type="number" step="0.01" value={walkInFoodCharge} onChange={(e) => setWalkInFoodCharge(e.target.value)} />
                </Field>
              </div>
            </>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Jooji
            </Button>
            <Button onClick={submit} loading={saving}>
              Diyaari Invoice
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xaqiiji tirtiridda"
        message="Ma hubtaa inaad tirtirto invoice-kan?"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
