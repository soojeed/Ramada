import { z } from "zod";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import type { Role } from "../../types/index.js";

const schema = z.object({
  roleName: z.string().min(1, "Role name waa lagama maarmaan."),
});

const fields: FieldDef[] = [{ name: "roleName", label: "Role Name", required: true }];

const columns: ColumnDef<Role>[] = [
  { key: "roleId", label: "ID" },
  { key: "roleName", label: "Role Name" },
];

export default function RolesPage() {
  return (
    <CrudPage<Role>
      title="Roles"
      subtitle="Maamul doorarka isticmaalayaasha (Admin, Cashier, iwm)."
      resourcePath="/roles"
      idKey="roleId"
      columns={columns}
      fields={fields}
      schema={schema}
      searchKeys={["roleName"]}
    />
  );
}
