import { useEffect, useState } from "react";
import { z } from "zod";
import { resource } from "../../api/resource.js";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import { Spinner } from "../../components/ui/Primitives.js";
import { Badge } from "../../components/ui/Primitives.js";
import { money } from "../../lib/format.js";
import type { Room, RoomType } from "../../types/index.js";

const schema = z.object({
  roomNumber: z.string().min(1, "Room number waa lagama maarmaan."),
  roomTypeId: z.coerce.number().int().positive("Fadlan dooro Room Type."),
  floor: z.coerce.number().int(),
  status: z.string().min(1),
  passportImagePath: z.string().optional(),
});

const columns: ColumnDef<Room>[] = [
  { key: "roomNumber", label: "Room #" },
  { key: "roomType", label: "Room Type", render: (r) => r.roomType?.typeName || "-" },
  { key: "price", label: "Price/Night", render: (r) => money(r.roomType?.pricePerNight) },
  { key: "floor", label: "Floor" },
  { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
];

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resource<RoomType>("/room-types")
      .list()
      .then(setRoomTypes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const fields: FieldDef[] = [
    { name: "roomNumber", label: "Room Number", required: true },
    {
      name: "roomTypeId",
      label: "Room Type",
      type: "select",
      required: true,
      options: roomTypes.map((rt) => ({ value: rt.roomTypeId, label: `${rt.typeName} — ${money(rt.pricePerNight)}` })),
    },
    { name: "floor", label: "Floor", type: "number", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "Available", label: "Available" },
        { value: "Occupied", label: "Occupied" },
        { value: "Maintenance", label: "Maintenance" },
      ],
    },
    { name: "passportImagePath", label: "Room Image Path" },
  ];

  return (
    <CrudPage<Room>
      title="Rooms"
      subtitle="Maamul qolalka hotel-ka iyo xaaladdooda."
      resourcePath="/rooms"
      idKey="roomId"
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ status: "Available" }}
      searchKeys={["roomNumber", "status"]}
      toRowValues={(row) => ({ ...row, roomTypeId: row.roomTypeId })}
    />
  );
}
