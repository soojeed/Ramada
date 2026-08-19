import { LogOut, Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.js";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.success("Si guul leh ayaad uga baxday.");
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:px-6">
      <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-none">
          <span className="text-sm font-medium text-ink-900">{user?.fullName}</span>
          <span className="text-xs text-gray-400">{user?.role}</span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <User className="h-4 w-4" />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
          title="Ka bax"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Ka bax</span>
        </button>
      </div>
    </header>
  );
}
