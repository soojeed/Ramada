import { z } from "zod";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import { dateOnly } from "../../lib/format.js";
import type { Guest } from "../../types/index.js";

const schema = z.object({
  fullName: z.string().min(1, "Full name waa lagama maarmaan."),
  phone: z.string().optional(),
  email: z.string().email("Email sax ma aha.").optional().or(z.literal("")),
  gender: z.string().optional(),
  address: z.string().optional(),
  passportImagePath: z.string().optional(),
});

const fields: FieldDef[] = [
  { name: "fullName", label: "Full Name", required: true },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: [
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
    ],
  },
  { name: "address", label: "Address", type: "textarea" },
  { name: "passportImagePath", label: "Passport Image Path" },
];

const columns: ColumnDef<Guest>[] = [
  { key: "fullName", label: "Full Name" },
  { key: "phone", label: "Phone", render: (r) => r.phone || "-" },
  { key: "email", label: "Email", render: (r) => r.email || "-" },
  { key: "gender", label: "Gender", render: (r) => r.gender || "-" },
  { key: "createdAt", label: "Joined", render: (r) => dateOnly(r.createdAt) },
];

export default function GuestsPage() {
  return (
    <CrudPage<Guest>
      title="Guests"
      subtitle="Maamul xogta martida hotel-ka."
      resourcePath="/guests"
      idKey="guestId"
      columns={columns}
      fields={fields}
      schema={schema}
      searchKeys={["fullName", "phone", "email"]}
    />
  );
}
