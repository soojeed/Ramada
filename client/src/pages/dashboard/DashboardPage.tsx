import { useEffect, useState } from "react";
import {
  BedDouble,
  Users,
  DoorOpen,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Scale,
  Clock3,
} from "lucide-react";
import { api } from "../../api/client.js";
import { Card, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { money } from "../../lib/format.js";
import { useAuth } from "../../context/AuthContext.js";
import type { DashboardSummary } from "../../types/index.js";

const STAT_CARDS: {
  key: keyof DashboardSummary;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isMoney?: boolean;
}[] = [
  { key: "totalRooms", label: "Total Rooms", icon: BedDouble, color: "bg-blue-50 text-blue-600" },
  { key: "occupiedRooms", label: "Occupied Rooms", icon: DoorOpen, color: "bg-orange-50 text-orange-600" },
  { key: "availableRooms", label: "Available Rooms", icon: DoorOpen, color: "bg-emerald-50 text-emerald-600" },
  { key: "totalGuests", label: "Total Guests", icon: Users, color: "bg-purple-50 text-purple-600" },
  { key: "activeBookings", label: "Active Bookings", icon: CalendarCheck, color: "bg-amber-50 text-amber-600" },
  { key: "pendingPayments", label: "Pending Payments", icon: Clock3, color: "bg-red-50 text-red-600" },
  { key: "todaysBookings", label: "Today's Bookings", icon: CalendarCheck, color: "bg-sky-50 text-sky-600" },
  { key: "totalIncome", label: "Total Income", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600", isMoney: true },
  { key: "totalExpense", label: "Total Expense", icon: TrendingDown, color: "bg-red-50 text-red-600", isMoney: true },
  { key: "netBalance", label: "Net Balance", icon: Scale, color: "bg-indigo-50 text-indigo-600", isMoney: true },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: DashboardSummary }>("/dashboard/summary");
        setSummary(res.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title={`Ku soo dhawoow, ${user?.fullName ?? ""}`} subtitle="Halkan waxaad ka arki kartaa guudmarka hotel-ka." />

      {loading || !summary ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((card) => (
            <Card key={card.key} className="p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className="text-xl font-semibold text-ink-900">
                    {card.isMoney ? money(summary[card.key] as number) : (summary[card.key] as number)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
