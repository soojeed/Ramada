import { z } from "zod";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import { money } from "../../lib/format.js";
import type { RoomType } from "../../types/index.js";

const schema = z.object({
  typeName: z.string().min(1, "Type name waa lagama maarmaan."),
  pricePerNight: z.coerce.number().nonnegative(),
  maxOccupancy: z.coerce.number().int().positive(),
  description: z.string().optional(),
});

const fields: FieldDef[] = [
  { name: "typeName", label: "Type Name", required: true },
  { name: "pricePerNight", label: "Price Per Night", type: "number", step: "0.01", required: true },
  { name: "maxOccupancy", label: "Max Occupancy", type: "number", required: true },
  { name: "description", label: "Description", type: "textarea" },
];

const columns: ColumnDef<RoomType>[] = [
  { key: "typeName", label: "Type Name" },
  { key: "pricePerNight", label: "Price / Night", render: (r) => money(r.pricePerNight) },
  { key: "maxOccupancy", label: "Max Occupancy" },
  { key: "description", label: "Description", render: (r) => r.description || "-" },
];

export default function RoomTypesPage() {
  return (
    <CrudPage<RoomType>
      title="Room Types"
      subtitle="Maamul noocyada qolalka iyo qiimahooda habeen kasta."
      resourcePath="/room-types"
      idKey="roomTypeId"
      columns={columns}
      fields={fields}
      schema={schema}
      searchKeys={["typeName"]}
    />
  );
}
