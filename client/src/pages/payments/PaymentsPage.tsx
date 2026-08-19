import { useEffect, useState } from "react";
import { CreditCard, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../api/client.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input, Select } from "../../components/ui/Field.js";
import { Modal } from "../../components/ui/Modal.js";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { dateTime, money } from "../../lib/format.js";
import type { Payment } from "../../types/index.js";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [recording, setRecording] = useState<Payment | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Payment[] }>("/payments", {
        params: filter ? { status: filter } : undefined,
      });
      setPayments(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function openRecord(p: Payment) {
    setRecording(p);
    setAmount(String(p.balance));
    setMethod("Cash");
  }

  async function submitRecord() {
    if (!recording) return;
    setSaving(true);
    try {
      await api.post(`/payments/${recording.paymentId}/record`, {
        amountPaid: Number(amount),
        paymentMethod: method,
      });
      toast.success("Lacagta si guul leh ayaa loo diiwaan geliyay.");
      setRecording(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRefund(p: Payment) {
    try {
      await api.post(`/payments/${p.paymentId}/refund`);
      toast.success("Payment waa la refund gareeyay.");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="La soco lacagaha booking-yada iyo food orders-ka, oo diiwaan geli lacagaha la bixiyay."
        actions={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[160px]">
            <option value="">Dhammaan Status</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Refunded">Refunded</option>
          </Select>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : payments.length === 0 ? (
          <EmptyState title="Payment lama helin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ficillo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {p.customerDisplayName} {p.isWalkIn && <span className="text-xs text-gray-400">(Walk-in)</span>}
                    </td>
                    <td className="px-4 py-3">{p.category ?? "-"}</td>
                    <td className="px-4 py-3">{money(p.amount)}</td>
                    <td className="px-4 py-3">{money(p.amountPaid)}</td>
                    <td className="px-4 py-3">
                      {p.balance > 0 ? (
                        <span className="text-red-600 font-medium">{money(p.balance)}</span>
                      ) : (
                        <span className="text-emerald-600">$0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{p.paymentMethod}</td>
                    <td className="px-4 py-3">{dateTime(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <Badge>{p.status ?? "-"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {p.status !== "Paid" && p.status !== "Refunded" && (
                          <button
                            onClick={() => openRecord(p)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Record payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        {p.status === "Paid" && (
                          <button
                            onClick={() => handleRefund(p)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                            title="Refund"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!recording} onClose={() => setRecording(null)} title="Diiwaan geli Lacag Bixin">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Balance hadhay: <span className="font-semibold text-ink-900">{money(recording?.balance)}</span>
          </p>
          <Field label="Lacagta la bixinayo" required>
            <Input type="number" step="0.01" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Payment Method" required>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </Select>
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRecording(null)}>
              Jooji
            </Button>
            <Button onClick={submitRecord} loading={saving}>
              Kaydi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
