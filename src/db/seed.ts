import { db } from "./index";
import { users, projects, units, clients, bookings, installmentSchedule, activityLog } from "./schema";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@alhamd.com"));

  if (existingUser.length === 0) {
    const hashed = await hashPassword("admin123");
    await db.insert(users).values({
      email: "admin@alhamd.com",
      password: hashed,
      name: "Admin User",
      role: "admin",
    });
    console.log("  ✓ Admin user created");
  } else {
    console.log("  - Admin user already exists");
  }

  const projectData = [
    {
      name: "Al Hamd Garden Estate",
      projectCode: "AHG-001",
      location: "Phase 7, Gulshan-e-Maymar, Karachi",
      developer: "Al Hamd Developers",
      description: "A premium gated community with lush green parks and wide boulevards.",
      status: "active",
      amenities: ["Park", "Mosque", "Community Hall", "24/7 Security", "Wide Roads", "Sewerage System"],
    },
    {
      name: "Al Hamd Business Center",
      projectCode: "AHB-001",
      location: "Shahrah-e-Faisal, Karachi",
      developer: "Al Hamd Developers",
      description: "Prime commercial property development with modern office spaces.",
      status: "active",
      amenities: ["Parking", "Elevators", "Generator Backup", "Security", "Cafeteria"],
    },
    {
      name: "Al Hamd Residencia",
      projectCode: "AHR-001",
      location: "DHA Phase 6, Lahore",
      developer: "Al Hamd Developers",
      description: "Luxury residential villas and apartments in DHA Lahore.",
      status: "active",
      amenities: ["Swimming Pool", "Gym", "Park", "Community Center", "24/7 Security"],
    },
  ];

  const createdProjects: { id: number; name: string }[] = [];

  for (const p of projectData) {
    const [proj] = await db
      .insert(projects)
      .values(p)
      .returning({ id: projects.id, name: projects.name });
    createdProjects.push(proj);
    console.log(`  ✓ Project created: ${p.name}`);
  }

  const clientData = [
    { name: "Muhammad Ahmed Khan", cnic: "35201-1234567-1", phone: "0300-1112233", email: "ahmed@example.com", address: "House 12, Street 5, Gulshan-e-Iqbal, Karachi" },
    { name: "Fatima Hassan", cnic: "35201-7654321-2", phone: "0301-4455667", email: "fatima@example.com", address: "Flat 3B, Al Falah Tower, Lahore" },
    { name: "Omar Farooq", cnic: "35201-9876543-3", phone: "0302-7788990", email: "omar@example.com", address: "Plot 45, Sector F, DHA Phase 2, Islamabad" },
  ];

  const createdClients: { id: number; name: string }[] = [];

  for (const c of clientData) {
    const [client] = await db
      .insert(clients)
      .values(c)
      .returning({ id: clients.id, name: clients.name });
    createdClients.push(client);
    console.log(`  ✓ Client created: ${c.name}`);
  }

  const unitData = [
    { projectIdx: 0, unitNumber: "V-001", name: "Villa A", propertyType: "villa", area: "5000", price: "25000000", status: "available", bedrooms: 5, bathrooms: 6, facing: "Park Facing", cornerUnit: true },
    { projectIdx: 0, unitNumber: "V-002", name: "Villa B", propertyType: "villa", area: "4500", price: "22000000", status: "available", bedrooms: 4, bathrooms: 5, facing: "Main Boulevard", cornerUnit: false },
    { projectIdx: 0, unitNumber: "P-101", name: "Plot 101", propertyType: "plot", area: "2500", price: "8500000", status: "available", bedrooms: 0, bathrooms: 0, facing: "East", cornerUnit: false },
    { projectIdx: 0, unitNumber: "P-102", name: "Plot 102", propertyType: "plot", area: "3000", price: "9500000", status: "booked", bedrooms: 0, bathrooms: 0, facing: "West", cornerUnit: true },
    { projectIdx: 1, unitNumber: "O-001", name: "Office Suite 1", propertyType: "office", area: "1500", price: "18000000", status: "available", bedrooms: 0, bathrooms: 2, facing: "Street", cornerUnit: false },
    { projectIdx: 1, unitNumber: "S-001", name: "Shop 1", propertyType: "shop", area: "800", price: "12000000", status: "available", bedrooms: 0, bathrooms: 1, facing: "Main Road", cornerUnit: false },
    { projectIdx: 1, unitNumber: "S-002", name: "Shop 2", propertyType: "shop", area: "750", price: "11000000", status: "sold", bedrooms: 0, bathrooms: 1, facing: "Main Road", cornerUnit: false },
    { projectIdx: 2, unitNumber: "A-101", name: "Apartment 101", propertyType: "apartment", area: "1400", price: "15000000", status: "available", bedrooms: 3, bathrooms: 2, facing: "Garden", cornerUnit: false },
    { projectIdx: 2, unitNumber: "A-102", name: "Apartment 102", propertyType: "apartment", area: "1200", price: "13000000", status: "available", bedrooms: 2, bathrooms: 2, facing: "City View", cornerUnit: false },
  ];

  const createdUnits: { id: number; unitNumber: string }[] = [];

  for (const u of unitData) {
    const proj = createdProjects[u.projectIdx];
    if (!proj) continue;
    const [unit] = await db
      .insert(units)
      .values({
        projectId: proj.id,
        unitNumber: u.unitNumber,
        name: u.name,
        propertyType: u.propertyType,
        area: u.area,
        areaUnit: "sq ft",
        price: u.price,
        status: u.status,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        facing: u.facing,
        cornerUnit: u.cornerUnit,
      })
      .returning({ id: units.id, unitNumber: units.unitNumber });
    createdUnits.push(unit);
    console.log(`  ✓ Unit created: ${u.unitNumber} (${u.name}) in ${proj.name}`);
  }

  if (createdClients.length > 0 && createdUnits.length > 3) {
    const bookedUnit = createdUnits[3];
    const client = createdClients[0];
    const proj = createdProjects[0];

    if (bookedUnit && client && proj) {
      const refNumber = "AHD-" + Date.now().toString(36).toUpperCase();

      const [booking] = await db
        .insert(bookings)
        .values({
          projectId: proj.id,
          unitId: bookedUnit.id,
          clientId: client.id,
          salePrice: "9500000",
          downPayment: "950000",
          paymentType: "installment",
          installmentCount: 24,
          installmentFrequency: "monthly",
          installmentAmount: "356250",
          bookingDate: new Date().toISOString().split("T")[0],
          status: "booked",
          referenceNumber: refNumber,
        })
        .returning();

      const scheduleEntries = [];
      for (let i = 1; i <= 24; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        scheduleEntries.push({
          bookingId: booking.id,
          installmentNumber: i,
          dueDate: dueDate.toISOString().split("T")[0],
          amount: "356250",
          paidAmount: i <= 2 ? "356250" : "0",
          status: i <= 2 ? "paid" : "pending",
          paidDate: i <= 2 ? new Date().toISOString().split("T")[0] : null,
        });
      }
      await db.insert(installmentSchedule).values(scheduleEntries);

      await db.insert(activityLog).values({
        action: "booking_created",
        details: `Booking ${refNumber} created for ${client.name} - ${bookedUnit.unitNumber}`,
        entityType: "booking",
        entityId: booking.id,
      });

      console.log(`  ✓ Sample booking created: ${refNumber}`);
    }
  }

  console.log("\n✅ Seed complete!");
  console.log("   Admin: admin@alhamd.com / admin123");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
