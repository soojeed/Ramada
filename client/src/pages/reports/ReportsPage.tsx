import { useEffect, useState } from "react";
import { BarChart3, TrendingDown, TrendingUp, Scale } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../api/client.js";
import { Card, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { money } from "../../lib/format.js";

interface RevenueData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  byCategory: { category: string; income: number; expense: number }[];
}

interface OccupancyRow {
  status: string;
  count: number;
  percent: number;
}

interface PayrollData {
  totalAdvance: number;
  totalSalaryPaid: number;
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollData | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [revRes, occRes, payRes] = await Promise.all([
          api.get<{ success: boolean; data: RevenueData }>("/reports/revenue"),
          api.get<{ success: boolean; data: OccupancyRow[] }>("/reports/occupancy"),
          api.get<{ success: boolean; data: PayrollData }>("/reports/staff-payroll"),
        ]);
        setRevenue(revRes.data.data);
        setOccupancy(occRes.data.data);
        setPayroll(payRes.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner label="Reports-ka waa la soo saarayaa..." />;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Warbixin guud oo ku saabsan dakhliga, qolalka, iyo mushaharka shaqaalaha (30-kii maalmood ee ugu dambeeyay)."
      />

      {revenue && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Income</p>
              <p className="text-lg font-semibold text-ink-900">{money(revenue.totalIncome)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Expense</p>
              <p className="text-lg font-semibold text-ink-900">{money(revenue.totalExpense)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Balance</p>
              <p className="text-lg font-semibold text-ink-900">{money(revenue.netBalance)}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <BarChart3 className="h-4 w-4 text-gray-400" /> Revenue by Category
          </h3>
          {revenue && revenue.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenue.byCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Xog lama helin.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <BarChart3 className="h-4 w-4 text-gray-400" /> Room Occupancy
          </h3>
          {occupancy.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={occupancy}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(d: { status?: string; percent?: number }) => `${d.status} ${d.percent}%`}
                >
                  {occupancy.map((entry, i) => (
                    <Cell key={entry.status} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Xog lama helin.</p>
          )}
        </Card>
      </div>

      {payroll && (
        <Card className="mt-4 p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Staff Payroll (30 days)</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs text-gray-500">Salary Advances Paid</p>
              <p className="text-lg font-semibold text-ink-900">{money(payroll.totalAdvance)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-gray-500">Full Salaries Paid</p>
              <p className="text-lg font-semibold text-ink-900">{money(payroll.totalSalaryPaid)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
