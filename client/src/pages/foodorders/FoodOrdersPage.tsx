import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../api/client.js";
import { resource } from "../../api/resource.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input, Select } from "../../components/ui/Field.js";
import { ConfirmDialog, Modal } from "../../components/ui/Modal.js";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { dateTime, money } from "../../lib/format.js";
import type { Booking, FoodItem, FoodOrder } from "../../types/index.js";

interface LineDraft {
  itemId: number;
  quantity: number;
}

const foodOrdersApi = resource<FoodOrder>("/food-orders");

export default function FoodOrdersPage() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<FoodOrder | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [customerType, setCustomerType] = useState<"booking" | "walkin">("walkin");
  const [bookingId, setBookingId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ itemId: 0, quantity: 1 }]);

  async function load() {
    setLoading(true);
    try {
      const [o, f, b] = await Promise.all([
        foodOrdersApi.list(),
        resource<FoodItem>("/food-items").list(),
        api.get<{ success: boolean; data: Booking[] }>("/bookings", { params: { search: "" } }),
      ]);
      setOrders(o);
      setFoodItems(f);
      setBookings(b.data.data.filter((bk) => bk.status === "Active" || bk.status === "Upcoming"));
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
    setCustomerType("walkin");
    setBookingId("");
    setWalkInName("");
    setLines([{ itemId: 0, quantity: 1 }]);
    setModalOpen(true);
  }

  function updateLine(idx: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { itemId: 0, quantity: 1 }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = lines.reduce((sum, l) => {
    const item = foodItems.find((f) => f.itemId === l.itemId);
    return sum + (item ? Number(item.price) * l.quantity : 0);
  }, 0);

  async function submit() {
    const validLines = lines.filter((l) => l.itemId > 0 && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Ugu yaraan hal food item waa in la doortaa.");
      return;
    }
    if (customerType === "booking" && !bookingId) {
      toast.error("Fadlan dooro Booking.");
      return;
    }
    if (customerType === "walkin" && !walkInName.trim()) {
      toast.error("Fadlan geli magaca Walk-in Customer.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/food-orders", {
        bookingId: customerType === "booking" ? Number(bookingId) : null,
        walkInCustomerName: customerType === "walkin" ? walkInName : null,
        items: validLines,
      });
      toast.success("Food order si guul leh ayaa loo diyaariyay.");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(order: FoodOrder) {
    try {
      await api.post(`/food-orders/${order.orderId}/mark-paid`);
      toast.success("Order waa la calaamadiyay Paid.");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await foodOrdersApi.remove(deleting.orderId);
      toast.success("Food order si guul leh ayaa loo tirtiray.");
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
        title="Food Orders"
        subtitle="Diyaari dalabyada cuntada — booking guests ama walk-in customers."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Dalab Cusub
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <EmptyState title="Food order lama helin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ficillo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {o.bookingId ? o.booking?.guest?.fullName ?? `Booking #${o.bookingId}` : o.walkInCustomerName || "Walk-in"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {o.orderItems.map((it) => `${it.foodItem?.itemName ?? ""} x${it.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3">{money(o.totalPrice)}</td>
                    <td className="px-4 py-3">{dateTime(o.orderDate)}</td>
                    <td className="px-4 py-3">
                      <Badge>{o.isPaid ? "Paid" : "Pending"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {!o.isPaid && (
                          <button
                            onClick={() => markPaid(o)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Mark Paid"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleting(o)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Dalab Cunto Cusub" width="max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomerType("walkin")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${customerType === "walkin" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}
            >
              Walk-in Customer
            </button>
            <button
              type="button"
              onClick={() => setCustomerType("booking")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${customerType === "booking" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}
            >
              Booking Guest
            </button>
          </div>

          {customerType === "walkin" ? (
            <Field label="Walk-in Customer Name" required>
              <Input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} />
            </Field>
          ) : (
            <Field label="Booking" required>
              <Select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                <option value="">-- Dooro Booking --</option>
                {bookings.map((b) => (
                  <option key={b.bookingId} value={b.bookingId}>
                    #{b.bookingId} — {b.guest?.fullName} (Room {b.room?.roomNumber})
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-900">Food Items</span>
              <Button type="button" size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" /> Line
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  className="flex-1"
                  value={line.itemId || ""}
                  onChange={(e) => updateLine(idx, { itemId: Number(e.target.value) })}
                >
                  <option value="">-- Dooro Item --</option>
                  {foodItems.map((f) => (
                    <option key={f.itemId} value={f.itemId}>
                      {f.itemName} — {money(f.price)}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                />
                {lines.length > 1 && (
                  <button onClick={() => removeLine(idx)} className="text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="text-lg font-semibold text-ink-900">{money(total)}</span>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Jooji
            </Button>
            <Button onClick={submit} loading={saving}>
              Diyaari Dalabka
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xaqiiji tirtiridda"
        message="Ma hubtaa inaad tirtirto food order-kan?"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
