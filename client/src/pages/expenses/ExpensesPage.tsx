import { z } from "zod";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import { dateOnly, money, toDateInputValue } from "../../lib/format.js";
import type { Expense } from "../../types/index.js";

const schema = z.object({
  title: z.string().min(1, "Title waa lagama maarmaan."),
  amount: z.coerce.number().nonnegative(),
  category: z.string().optional(),
  expenseDate: z.string().optional(),
  notes: z.string().optional(),
});

const fields: FieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
  { name: "category", label: "Category" },
  { name: "expenseDate", label: "Expense Date", type: "date" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const columns: ColumnDef<Expense>[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category", render: (r) => r.category || "-" },
  { key: "amount", label: "Amount", render: (r) => money(r.amount) },
  { key: "expenseDate", label: "Date", render: (r) => dateOnly(r.expenseDate) },
];

export default function ExpensesPage() {
  return (
    <CrudPage<Expense>
      title="Expenses"
      subtitle="Diiwaan geli kharashaadka hotel-ka."
      resourcePath="/expenses"
      idKey="expenseId"
      columns={columns}
      fields={fields}
      schema={schema}
      searchKeys={["title", "category"]}
      toRowValues={(row) => ({ ...row, expenseDate: toDateInputValue(row.expenseDate) })}
    />
  );
}
