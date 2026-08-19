import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";
import { z } from "zod";
import { api } from "../../api/client.js";
import { CrudPage, type ColumnDef, type FieldDef } from "../../components/crud/CrudPage.js";
import { Card } from "../../components/ui/Primitives.js";
import { dateOnly, money, toDateInputValue } from "../../lib/format.js";
import type { FinanceRecord } from "../../types/index.js";

const schema = z.object({
  description: z.string().min(1, "Description waa lagama maarmaan."),
  income: z.coerce.number().nonnegative().default(0),
  expense: z.coerce.number().nonnegative().default(0),
  transactionDate: z.string().optional(),
  category: z.string().optional(),
});

const fields: FieldDef[] = [
  { name: "description", label: "Description", required: true },
  { name: "income", label: "Income", type: "number", step: "0.01" },
  { name: "expense", label: "Expense", type: "number", step: "0.01" },
  { name: "transactionDate", label: "Date", type: "date" },
  { name: "category", label: "Category" },
];

const columns: ColumnDef<FinanceRecord>[] = [
  { key: "description", label: "Description" },
  { key: "category", label: "Category", render: (r) => r.category || "-" },
  { key: "income", label: "Income", render: (r) => <span className="text-emerald-600">{money(r.income)}</span> },
  { key: "expense", label: "Expense", render: (r) => <span className="text-red-600">{money(r.expense)}</span> },
  { key: "balance", label: "Balance", render: (r) => money(r.balance) },
  { key: "transactionDate", label: "Date", render: (r) => dateOnly(r.transactionDate) },
];

export default function FinancePage() {
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; netBalance: number } | null>(
    null
  );

  useEffect(() => {
    api
      .get<{ success: boolean; summary: typeof summary }>("/finance")
      .then((res) => setSummary(res.data.summary ?? null));
  }, []);

  return (
    <div>
      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Income</p>
              <p className="text-lg font-semibold text-ink-900">{money(summary.totalIncome)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Expense</p>
              <p className="text-lg font-semibold text-ink-900">{money(summary.totalExpense)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Balance</p>
              <p className="text-lg font-semibold text-ink-900">{money(summary.netBalance)}</p>
            </div>
          </Card>
        </div>
      )}

      <CrudPage<FinanceRecord>
        title="Finance"
        subtitle="Diiwaanka dakhliga iyo kharashaadka guud (waxaa si otomaatig ah loo daraa marka Payments/Advances la diiwaan geliyo)."
        resourcePath="/finance"
        idKey="financeId"
        columns={columns}
        fields={fields}
        schema={schema}
        toRowValues={(row) => ({ ...row, transactionDate: toDateInputValue(row.transactionDate) })}
      />
    </div>
  );
}
