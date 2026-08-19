import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api, getApiErrorMessage } from "../../api/client.js";
import { resource } from "../../api/resource.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input, Select } from "../../components/ui/Field.js";
import { ConfirmDialog, Modal } from "../../components/ui/Modal.js";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { dateOnly, money } from "../../lib/format.js";
import type { Booking, Guest, Room } from "../../types/index.js";

const schema = z.object({
  guestId: z.coerce.number().int().positive("Fadlan dooro Guest."),
  roomId: z.coerce.number().int().positive("Fadlan dooro Room."),
  checkInDate: z.string().min(1, "Check-In waa lagama maarmaan."),
  checkOutDate: z.string().min(1, "Check-Out waa lagama maarmaan."),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
});
type FormValues = z.infer<typeof schema>;

const bookingsApi = resource<Booking>("/bookings");

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [balanceByBooking, setBalanceByBooking] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema as never), defaultValues: { discountPercent: 0 } });

  async function load() {
    setLoading(true);
    try {
      const [bookingsRes, guestList] = await Promise.all([
        api.get<{ success: boolean; data: Booking[]; meta: { balanceByBooking: Record<number, number>; availableRooms: Room[] } }>(
          "/bookings",
          { params: { search } }
        ),
        resource<Guest>("/guests").list(),
      ]);
      setBookings(bookingsRes.data.data);
      setBalanceByBooking(bookingsRes.data.meta.balanceByBooking);
      setAvailableRooms(bookingsRes.data.meta.availableRooms);
      setGuests(guestList);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    reset({ discountPercent: 0 });
    setModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await bookingsApi.create(values);
      toast.success("✅ Booking si guul ah ayaa loo diyaariyay!");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckout(id: number) {
    setCheckingOut(id);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/bookings/${id}/checkout`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setCheckingOut(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await bookingsApi.remove(deleting.bookingId);
      toast.success("Booking si guul ah ayaa loo tirtiray.");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter((b) => b.guest?.fullName?.toLowerCase().includes(q));
  }, [bookings, search]);

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Maamul buugaagta joogitaanka martida — waxay si otomaatig ah isu bedeli doonaan Active/CheckedOut."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Booking Cusub
          </Button>
        }
      />

      <div className="mb-4 relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Raadi guest..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState title="Booking lama helin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Final Amount</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ficillo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">{b.guest?.fullName ?? "-"}</td>
                    <td className="px-4 py-3">{b.room?.roomNumber ?? "-"}</td>
                    <td className="px-4 py-3">{dateOnly(b.checkInDate)}</td>
                    <td className="px-4 py-3">{dateOnly(b.checkOutDate)}</td>
                    <td className="px-4 py-3">{money(b.finalAmount)}</td>
                    <td className="px-4 py-3">
                      {balanceByBooking[b.bookingId] ? (
                        <span className="text-red-600 font-medium">{money(balanceByBooking[b.bookingId])}</span>
                      ) : (
                        <span className="text-emerald-600">$0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{b.status ?? "-"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {b.status === "Active" && (
                          <button
                            onClick={() => handleCheckout(b.bookingId)}
                            disabled={checkingOut === b.bookingId}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                            title="Checkout"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleting(b)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Booking Cusub">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Guest" required error={errors.guestId?.message}>
            <Select {...register("guestId")} error={!!errors.guestId}>
              <option value="">-- Dooro Guest --</option>
              {guests.map((g) => (
                <option key={g.guestId} value={g.guestId}>
                  {g.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Room (bannaan)" required error={errors.roomId?.message}>
            <Select {...register("roomId")} error={!!errors.roomId}>
              <option value="">-- Dooro Room --</option>
              {availableRooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.roomNumber} — {r.roomType?.typeName} ({money(r.roomType?.pricePerNight)}/night)
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-In" required error={errors.checkInDate?.message}>
              <Input type="date" {...register("checkInDate")} error={!!errors.checkInDate} />
            </Field>
            <Field label="Check-Out" required error={errors.checkOutDate?.message}>
              <Input type="date" {...register("checkOutDate")} error={!!errors.checkOutDate} />
            </Field>
          </div>
          <Field label="Discount %" error={errors.discountPercent?.message}>
            <Input type="number" step="0.01" min={0} max={100} {...register("discountPercent")} />
          </Field>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Jooji
            </Button>
            <Button type="submit" loading={saving}>
              Abuur Booking
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xaqiiji tirtiridda Booking"
        message={`Ma hubtaa inaad tirtirto booking-ka ${deleting?.guest?.fullName ?? ""}? Payments, invoices iyo food orders-ka la xiriira sidoo kale waa la tirtiri doonaa.`}
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
