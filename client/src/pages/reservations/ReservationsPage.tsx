import { useEffect, useState } from "react";
import { z } from "zod";
import { resource } from "../../api/resource.js";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import { Badge, Spinner } from "../../components/ui/Primitives.js";
import { dateOnly, toDateInputValue } from "../../lib/format.js";
import type { Guest, Reservation, Room } from "../../types/index.js";

const schema = z.object({
  guestId: z.coerce.number().int().positive("Fadlan dooro Guest."),
  roomId: z.coerce.number().int().optional(),
  checkInDate: z.string().min(1, "Check-In date waa lagama maarmaan."),
  checkOutDate: z.string().min(1, "Check-Out date waa lagama maarmaan."),
  status: z.string().optional(),
});

const columns: ColumnDef<Reservation>[] = [
  { key: "guest", label: "Guest", render: (r) => r.guest?.fullName || "-" },
  { key: "room", label: "Room", render: (r) => r.room?.roomNumber || "-" },
  { key: "checkInDate", label: "Check-In", render: (r) => dateOnly(r.checkInDate) },
  { key: "checkOutDate", label: "Check-Out", render: (r) => dateOnly(r.checkOutDate) },
  { key: "status", label: "Status", render: (r) => <Badge>{r.status ?? "Pending"}</Badge> },
];

export default function ReservationsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([resource<Guest>("/guests").list(), resource<Room>("/rooms").list()])
      .then(([g, r]) => {
        setGuests(g);
        setRooms(r);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const fields: FieldDef[] = [
    {
      name: "guestId",
      label: "Guest",
      type: "select",
      required: true,
      options: guests.map((g) => ({ value: g.guestId, label: g.fullName })),
    },
    {
      name: "roomId",
      label: "Room (ikhtiyaari)",
      type: "select",
      options: rooms.map((r) => ({ value: r.roomId, label: `${r.roomNumber} — ${r.roomType?.typeName ?? ""}` })),
    },
    { name: "checkInDate", label: "Check-In Date", type: "date", required: true },
    { name: "checkOutDate", label: "Check-Out Date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Pending", label: "Pending" },
        { value: "Confirmed", label: "Confirmed" },
        { value: "Cancelled", label: "Cancelled" },
      ],
    },
  ];

  return (
    <CrudPage<Reservation>
      title="Reservations"
      subtitle="Boos-hayn qolal mustaqbal — waxay si otomaatig ah ugu beddelmi doonaan Booking marka la gaadho taariikhda."
      resourcePath="/reservations"
      idKey="reservationId"
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ status: "Pending" }}
      toRowValues={(row) => ({
        ...row,
        checkInDate: toDateInputValue(row.checkInDate),
        checkOutDate: toDateInputValue(row.checkOutDate),
      })}
    />
  );
}
