import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  BedDouble,
  Tags,
  CalendarClock,
  Users,
  UtensilsCrossed,
  ClipboardList,
  Receipt,
  CreditCard,
  LineChart,
  Wallet,
  BarChart3,
  Briefcase,
  ShieldCheck,
  UserCog,
  Hotel,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleKey?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: BedDouble, moduleKey: "Bookings" },
  { to: "/reservations", label: "Reservations", icon: CalendarClock, moduleKey: "Reservations" },
  { to: "/guests", label: "Guests", icon: Users, moduleKey: "Guests" },
  { to: "/rooms", label: "Rooms", icon: Hotel, moduleKey: "Rooms" },
  { to: "/room-types", label: "Room Types", icon: Tags, moduleKey: "RoomTypes" },
  { to: "/food-items", label: "Food Items", icon: UtensilsCrossed, moduleKey: "FoodItems" },
  { to: "/food-orders", label: "Food Orders", icon: ClipboardList, moduleKey: "FoodOrders" },
  { to: "/invoices", label: "Invoices", icon: Receipt, moduleKey: "Invoices" },
  { to: "/payments", label: "Payments", icon: CreditCard, moduleKey: "Payments" },
  { to: "/finance", label: "Finance", icon: LineChart, moduleKey: "Finance" },
  { to: "/expenses", label: "Expenses", icon: Wallet, moduleKey: "Expenses" },
  { to: "/reports", label: "Reports", icon: BarChart3, moduleKey: "Reports" },
  { to: "/staffs", label: "Staffs", icon: Briefcase, moduleKey: "Staffs" },
  { to: "/users", label: "Users", icon: UserCog, adminOnly: true },
  { to: "/roles", label: "Roles", icon: ShieldCheck, adminOnly: true },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { can, isAdmin } = useAuth();

  const items = NAV_ITEMS.filter((i) => {
    if (i.adminOnly) return isAdmin;
    if (i.moduleKey) return can(i.moduleKey);
    return true;
  });

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            R
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900 leading-none">Ramada Hotel</p>
            <p className="text-xs text-gray-400 leading-none mt-1">Management System</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 p-3 overflow-y-auto h-[calc(100%-4rem)]">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-ink-900"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
