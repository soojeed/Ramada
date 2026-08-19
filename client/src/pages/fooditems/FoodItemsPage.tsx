import { z } from "zod";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import { money } from "../../lib/format.js";
import type { FoodItem } from "../../types/index.js";

const schema = z.object({
  itemName: z.string().min(1, "Item name waa lagama maarmaan."),
  price: z.coerce.number().nonnegative(),
  category: z.string().optional(),
  imagePath: z.string().optional(),
});

const fields: FieldDef[] = [
  { name: "itemName", label: "Item Name", required: true },
  { name: "price", label: "Price", type: "number", step: "0.01", required: true },
  { name: "category", label: "Category" },
  { name: "imagePath", label: "Image Path", placeholder: "/Uploads/FoodItems/xxx.jpg" },
];

const columns: ColumnDef<FoodItem>[] = [
  { key: "itemName", label: "Item Name" },
  { key: "category", label: "Category", render: (r) => r.category || "-" },
  { key: "price", label: "Price", render: (r) => money(r.price) },
];

export default function FoodItemsPage() {
  return (
    <CrudPage<FoodItem>
      title="Food Items"
      subtitle="Maamul menu-ga cuntada iyo qiimayaasha."
      resourcePath="/food-items"
      idKey="itemId"
      columns={columns}
      fields={fields}
      schema={schema}
      searchKeys={["itemName", "category"]}
    />
  );
}
