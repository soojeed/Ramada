import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext.js";
import { AdminRoute, ModuleRoute, ProtectedRoute } from "./components/layout/Guards.js";
import { AppLayout } from "./components/layout/AppLayout.js";

import LoginPage from "./pages/auth/LoginPage.js";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.js";
import DashboardPage from "./pages/dashboard/DashboardPage.js";
import BookingsPage from "./pages/bookings/BookingsPage.js";
import ReservationsPage from "./pages/reservations/ReservationsPage.js";
import GuestsPage from "./pages/guests/GuestsPage.js";
import RoomsPage from "./pages/rooms/RoomsPage.js";
import RoomTypesPage from "./pages/roomtypes/RoomTypesPage.js";
import FoodItemsPage from "./pages/fooditems/FoodItemsPage.js";
import FoodOrdersPage from "./pages/foodorders/FoodOrdersPage.js";
import PaymentsPage from "./pages/payments/PaymentsPage.js";
import InvoicesPage from "./pages/invoices/InvoicesPage.js";
import FinancePage from "./pages/finance/FinancePage.js";
import ExpensesPage from "./pages/expenses/ExpensesPage.js";
import StaffsPage from "./pages/staffs/StaffsPage.js";
import ReportsPage from "./pages/reports/ReportsPage.js";
import UsersPage from "./pages/users/UsersPage.js";
import RolesPage from "./pages/roles/RolesPage.js";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated app shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/bookings"
              element={
                <ModuleRoute moduleKey="Bookings">
                  <BookingsPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ModuleRoute moduleKey="Reservations">
                  <ReservationsPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/guests"
              element={
                <ModuleRoute moduleKey="Guests">
                  <GuestsPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/rooms"
              element={
                <ModuleRoute moduleKey="Rooms">
                  <RoomsPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/room-types"
              element={
                <ModuleRoute moduleKey="RoomTypes">
                  <RoomTypesPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/food-items"
              element={
                <ModuleRoute moduleKey="FoodItems">
                  <FoodItemsPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/food-orders"
              element={
                <ModuleRoute moduleKey="FoodOrders">
                  <FoodOrdersPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ModuleRoute moduleKey="Payments">
                  <PaymentsPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ModuleRoute moduleKey="Invoices">
                  <InvoicesPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ModuleRoute moduleKey="Finance">
                  <FinancePage />
                </ModuleRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ModuleRoute moduleKey="Expenses">
                  <ExpensesPage />
                </ModuleRoute>
              }
            />
            <Route
              path="/staffs"
              element={
                <ModuleRoute moduleKey="Staffs">
                  <StaffsPage />
                </ModuleRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ModuleRoute moduleKey="Reports">
                  <ReportsPage />
                </ModuleRoute>
              }
            />

            {/* Admin only */}
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <AdminRoute>
                  <RolesPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
