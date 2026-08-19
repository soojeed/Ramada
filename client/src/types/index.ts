export interface Role {
  roleId: number;
  roleName: string;
}

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
  allowedModules: string[];
}

export interface RoomType {
  roomTypeId: number;
  typeName: string;
  pricePerNight: string | number;
  description?: string | null;
  maxOccupancy: number;
}

export interface Room {
  roomId: number;
  roomNumber: string;
  roomTypeId: number;
  roomType?: RoomType;
  floor: number;
  status: string;
  passportImagePath?: string | null;
}

export interface Guest {
  guestId: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  address?: string | null;
  createdAt: string;
  passportImagePath?: string | null;
}

export interface Reservation {
  reservationId: number;
  guestId: number;
  guest?: Guest;
  roomId?: number | null;
  room?: Room | null;
  checkInDate: string;
  checkOutDate: string;
  status?: string | null;
  createdAt: string;
}

export interface Booking {
  bookingId: number;
  guestId: number;
  guest?: Guest;
  reservationId?: number | null;
  roomId: number;
  room?: Room;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string | number;
  discountPercent: string | number;
  discountAmount: string | number;
  finalAmount: string | number;
  status?: string | null;
}

export interface FoodItem {
  itemId: number;
  itemName: string;
  price: string | number;
  category?: string | null;
  imagePath?: string | null;
}

export interface FoodOrderItem {
  foodOrderItemId: number;
  orderId: number;
  itemId: number;
  foodItem?: FoodItem;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
}

export interface FoodOrder {
  orderId: number;
  bookingId?: number | null;
  booking?: Booking;
  walkInCustomerName?: string | null;
  isPaid: boolean;
  totalPrice: string | number;
  orderDate: string;
  orderItems: FoodOrderItem[];
}

export interface Payment {
  paymentId: number;
  bookingId?: number | null;
  booking?: Booking;
  orderId?: number | null;
  walkInCustomerName?: string | null;
  roomCharge: string | number;
  foodCharge: string | number;
  amount: string | number;
  paymentMethod: string;
  paymentDate: string;
  status?: string | null;
  amountPaid: string | number;
  category?: string | null;
  balance: number;
  isWalkIn: boolean;
  customerDisplayName: string;
}

export interface Invoice {
  invoiceId: number;
  bookingId?: number | null;
  guestId?: number | null;
  guest?: Guest | null;
  walkInCustomerName?: string | null;
  totalRoomCharge: string | number;
  totalFoodCharge: string | number;
  grandTotal: string | number;
  invoiceDate: string;
  isPaid: boolean;
}

export interface FinanceRecord {
  financeId: number;
  description: string;
  income: string | number;
  expense: string | number;
  balance: number;
  transactionDate: string;
  category?: string | null;
  paymentId?: number | null;
}

export interface Expense {
  expenseId: number;
  title: string;
  amount: string | number;
  category?: string | null;
  expenseDate: string;
  notes?: string | null;
}

export interface Staff {
  staffId: number;
  fullName: string;
  position?: string | null;
  phone?: string | null;
  gender?: string | null;
  salary: string | number;
  hireDate: string;
}

export interface SalaryAdvance {
  salaryAdvanceId: number;
  staffId: number;
  amount: string | number;
  paymentType?: string | null;
  status?: string | null;
  paymentDate: string;
  notes?: string | null;
}

export interface AppUser {
  userId: number;
  fullName: string;
  username: string;
  roleId: number;
  role?: string;
  createdAt: string;
  allowedModules: string[];
}

export interface DashboardSummary {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalGuests: number;
  activeBookings: number;
  pendingPayments: number;
  todaysBookings: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}
