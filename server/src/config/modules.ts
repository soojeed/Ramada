/**
 * Mirrors AppModules.cs — the list of modules an Admin can grant to a
 * limited (Cashier) user. Users, Roles and Backup are intentionally
 * excluded: only Admin can ever manage those.
 */
export const APP_MODULES: Record<string, string> = {
  Bookings: "🛏️ Bookings",
  Reservations: "📅 Reservations",
  Guests: "👤 Guests",
  Rooms: "🚪 Rooms",
  RoomTypes: "🏷️ Room Types",
  FoodItems: "🍽️ Food Items",
  FoodOrders: "🧾 Food Orders",
  Invoices: "📄 Invoices",
  Payments: "💳 Payments",
  Finance: "📈 Finance",
  Expenses: "💸 Expenses",
  Reports: "📊 Reports",
  Staffs: "🧑‍💼 Staffs",
};

export const MODULE_KEYS = Object.keys(APP_MODULES);

export function parseModules(csv?: string | null): string[] {
  if (!csv || !csv.trim()) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toModulesCsv(modules: string[]): string {
  if (!modules) return "";
  const unique = Array.from(new Set(modules.filter((m) => MODULE_KEYS.includes(m))));
  return unique.join(",");
}
