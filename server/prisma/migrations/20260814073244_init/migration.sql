-- CreateTable
CREATE TABLE "Roles" (
    "RoleId" SERIAL NOT NULL,
    "RoleName" TEXT NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("RoleId")
);

-- CreateTable
CREATE TABLE "Users" (
    "UserId" SERIAL NOT NULL,
    "FullName" TEXT,
    "Username" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "RoleId" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SecurityQuestion" TEXT,
    "SecurityAnswerHash" TEXT,
    "AllowedModules" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("UserId")
);

-- CreateTable
CREATE TABLE "RoomTypes" (
    "RoomTypeId" SERIAL NOT NULL,
    "TypeName" TEXT NOT NULL,
    "PricePerNight" DECIMAL(10,2) NOT NULL,
    "Description" TEXT,
    "MaxOccupancy" INTEGER NOT NULL,

    CONSTRAINT "RoomTypes_pkey" PRIMARY KEY ("RoomTypeId")
);

-- CreateTable
CREATE TABLE "Rooms" (
    "RoomId" SERIAL NOT NULL,
    "RoomNumber" TEXT NOT NULL,
    "RoomTypeId" INTEGER NOT NULL,
    "Floor" INTEGER NOT NULL,
    "Status" TEXT NOT NULL,
    "PassportImagePath" TEXT,

    CONSTRAINT "Rooms_pkey" PRIMARY KEY ("RoomId")
);

-- CreateTable
CREATE TABLE "Guests" (
    "GuestId" SERIAL NOT NULL,
    "FullName" TEXT,
    "Phone" TEXT,
    "Email" TEXT,
    "Gender" TEXT,
    "Address" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "PassportImagePath" TEXT,

    CONSTRAINT "Guests_pkey" PRIMARY KEY ("GuestId")
);

-- CreateTable
CREATE TABLE "Reservations" (
    "ReservationId" SERIAL NOT NULL,
    "GuestId" INTEGER NOT NULL,
    "RoomId" INTEGER,
    "CheckInDate" TIMESTAMP(3) NOT NULL,
    "CheckOutDate" TIMESTAMP(3) NOT NULL,
    "Status" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservations_pkey" PRIMARY KEY ("ReservationId")
);

-- CreateTable
CREATE TABLE "Bookings" (
    "BookingId" SERIAL NOT NULL,
    "GuestId" INTEGER NOT NULL,
    "ReservationId" INTEGER,
    "RoomId" INTEGER NOT NULL,
    "CheckInDate" TIMESTAMP(3) NOT NULL,
    "CheckOutDate" TIMESTAMP(3) NOT NULL,
    "TotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "DiscountPercent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "DiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "FinalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Status" TEXT,

    CONSTRAINT "Bookings_pkey" PRIMARY KEY ("BookingId")
);

-- CreateTable
CREATE TABLE "FoodItems" (
    "ItemId" SERIAL NOT NULL,
    "ItemName" TEXT NOT NULL,
    "Price" DECIMAL(10,2) NOT NULL,
    "Category" TEXT,
    "ImagePath" TEXT,

    CONSTRAINT "FoodItems_pkey" PRIMARY KEY ("ItemId")
);

-- CreateTable
CREATE TABLE "FoodOrders" (
    "OrderId" SERIAL NOT NULL,
    "BookingId" INTEGER,
    "WalkInCustomerName" TEXT,
    "IsPaid" BOOLEAN NOT NULL DEFAULT false,
    "TotalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "OrderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodOrders_pkey" PRIMARY KEY ("OrderId")
);

-- CreateTable
CREATE TABLE "FoodOrderItems" (
    "FoodOrderItemId" SERIAL NOT NULL,
    "OrderId" INTEGER NOT NULL,
    "ItemId" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "UnitPrice" DECIMAL(10,2) NOT NULL,
    "TotalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "FoodOrderItems_pkey" PRIMARY KEY ("FoodOrderItemId")
);

-- CreateTable
CREATE TABLE "Payments" (
    "PaymentId" SERIAL NOT NULL,
    "BookingId" INTEGER,
    "OrderId" INTEGER,
    "WalkInCustomerName" TEXT,
    "RoomCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "FoodCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "PaymentMethod" TEXT NOT NULL,
    "PaymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Status" TEXT,
    "AmountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Category" TEXT,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("PaymentId")
);

-- CreateTable
CREATE TABLE "Invoices" (
    "InvoiceId" SERIAL NOT NULL,
    "BookingId" INTEGER,
    "GuestId" INTEGER,
    "WalkInCustomerName" TEXT,
    "TotalRoomCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "TotalFoodCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "GrandTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "InvoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Invoices_pkey" PRIMARY KEY ("InvoiceId")
);

-- CreateTable
CREATE TABLE "Finance" (
    "FinanceId" SERIAL NOT NULL,
    "Description" TEXT NOT NULL,
    "Income" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Expense" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "TransactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Category" TEXT,
    "PaymentId" INTEGER,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("FinanceId")
);

-- CreateTable
CREATE TABLE "Expenses" (
    "ExpenseId" SERIAL NOT NULL,
    "Title" TEXT NOT NULL,
    "Amount" DECIMAL(10,2) NOT NULL,
    "Category" TEXT,
    "ExpenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Notes" TEXT,

    CONSTRAINT "Expenses_pkey" PRIMARY KEY ("ExpenseId")
);

-- CreateTable
CREATE TABLE "Staffs" (
    "StaffId" SERIAL NOT NULL,
    "FullName" TEXT NOT NULL,
    "Position" TEXT,
    "Phone" TEXT,
    "Gender" TEXT,
    "Salary" DECIMAL(10,2) NOT NULL,
    "HireDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staffs_pkey" PRIMARY KEY ("StaffId")
);

-- CreateTable
CREATE TABLE "SalaryAdvances" (
    "SalaryAdvanceId" SERIAL NOT NULL,
    "StaffId" INTEGER NOT NULL,
    "Amount" DECIMAL(10,2) NOT NULL,
    "PaymentType" TEXT,
    "Status" TEXT,
    "PaymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Notes" TEXT,

    CONSTRAINT "SalaryAdvances_pkey" PRIMARY KEY ("SalaryAdvanceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES "Roles"("RoleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rooms" ADD CONSTRAINT "Rooms_RoomTypeId_fkey" FOREIGN KEY ("RoomTypeId") REFERENCES "RoomTypes"("RoomTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservations" ADD CONSTRAINT "Reservations_GuestId_fkey" FOREIGN KEY ("GuestId") REFERENCES "Guests"("GuestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservations" ADD CONSTRAINT "Reservations_RoomId_fkey" FOREIGN KEY ("RoomId") REFERENCES "Rooms"("RoomId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_GuestId_fkey" FOREIGN KEY ("GuestId") REFERENCES "Guests"("GuestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_RoomId_fkey" FOREIGN KEY ("RoomId") REFERENCES "Rooms"("RoomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_ReservationId_fkey" FOREIGN KEY ("ReservationId") REFERENCES "Reservations"("ReservationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrders" ADD CONSTRAINT "FoodOrders_BookingId_fkey" FOREIGN KEY ("BookingId") REFERENCES "Bookings"("BookingId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderItems" ADD CONSTRAINT "FoodOrderItems_OrderId_fkey" FOREIGN KEY ("OrderId") REFERENCES "FoodOrders"("OrderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodOrderItems" ADD CONSTRAINT "FoodOrderItems_ItemId_fkey" FOREIGN KEY ("ItemId") REFERENCES "FoodItems"("ItemId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_BookingId_fkey" FOREIGN KEY ("BookingId") REFERENCES "Bookings"("BookingId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_OrderId_fkey" FOREIGN KEY ("OrderId") REFERENCES "FoodOrders"("OrderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_GuestId_fkey" FOREIGN KEY ("GuestId") REFERENCES "Guests"("GuestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_BookingId_fkey" FOREIGN KEY ("BookingId") REFERENCES "Bookings"("BookingId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAdvances" ADD CONSTRAINT "SalaryAdvances_StaffId_fkey" FOREIGN KEY ("StaffId") REFERENCES "Staffs"("StaffId") ON DELETE CASCADE ON UPDATE CASCADE;
