import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  date,
  json,
  boolean,
} from "drizzle-orm/pg-core";

// ── Users / Auth ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Projects ──────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  projectCode: varchar("project_code", { length: 50 }),
  location: text("location"),
  developer: varchar("developer", { length: 255 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active"),
  launchDate: date("launch_date"),
  completionDate: date("completion_date"),
  images: json("images").$type<string[]>().default([]),
  brochure: text("brochure"),
  amenities: json("amenities").$type<string[]>().default([]),
  documents: json("documents").$type<{ name: string; url: string }[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Units ─────────────────────────────────────────────────────────
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  unitNumber: varchar("unit_number", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }),
  floor: varchar("floor", { length: 50 }),
  tower: varchar("tower", { length: 100 }),
  block: varchar("block", { length: 100 }),
  propertyType: varchar("property_type", { length: 50 }).default("apartment"),
  area: decimal("area", { precision: 12, scale: 2 }),
  areaUnit: varchar("area_unit", { length: 20 }).default("sq ft"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  facing: varchar("facing", { length: 50 }),
  cornerUnit: boolean("corner_unit").default(false),
  status: varchar("status", { length: 20 }).default("available"),
  description: text("description"),
  images: json("images").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Clients ───────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnic: varchar("cnic", { length: 15 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Bookings / Sales ──────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => projects.id)
    .notNull(),
  unitId: integer("unit_id")
    .references(() => units.id)
    .notNull(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  salePrice: decimal("sale_price", { precision: 15, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 15, scale: 2 }).default("0"),
  paymentType: varchar("payment_type", { length: 20 }).default("installment"),
  installmentCount: integer("installment_count").default(0),
  installmentFrequency: varchar("installment_frequency", { length: 20 }).default(
    "monthly"
  ),
  installmentAmount: decimal("installment_amount", { precision: 15, scale: 2 }),
  bookingDate: date("booking_date").notNull(),
  status: varchar("status", { length: 20 }).default("booked"),
  referenceNumber: varchar("reference_number", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Installment Schedule ──────────────────────────────────────────
export const installmentSchedule = pgTable("installment_schedule", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .references(() => bookings.id)
    .notNull(),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: date("due_date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default("0"),
  paidDate: date("paid_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  receiptNumber: varchar("receipt_number", { length: 50 }),
  paymentMethod: varchar("payment_method", { length: 30 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Payment History Log ───────────────────────────────────────────
export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .references(() => bookings.id)
    .notNull(),
  installmentId: integer("installment_id").references(() => installmentSchedule.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }),
  receiptNumber: varchar("receipt_number", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Activity Log ──────────────────────────────────────────────────
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
