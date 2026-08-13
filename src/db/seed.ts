import { db } from "./index";
import { users, projects, units, clients, bookings, installmentSchedule, activityLog } from "./schema";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@buildhub.com"));

  if (existingUser.length === 0) {
    const hashed = await hashPassword("admin123");
    await db.insert(users).values({
      email: "admin@buildhub.com",
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
      name: "Build Hub Garden Estate",
      projectCode: "AHG-001",
      location: "Phase 7, Gulshan-e-Maymar, Karachi",
      description: "A premium gated community with lush green parks and wide boulevards.",
      status: "active",
      amenities: ["Park", "Mosque", "Community Hall", "24/7 Security", "Wide Roads", "Sewerage System"],
    },
    {
      name: "Build Hub Business Center",
      projectCode: "AHB-001",
      location: "Shahrah-e-Faisal, Karachi",
      description: "Prime commercial property development with modern office spaces.",
      status: "active",
      amenities: ["Parking", "Elevators", "Generator Backup", "Security", "Cafeteria"],
    },
    {
      name: "Build Hub Residencia",
      projectCode: "AHR-001",
      location: "DHA Phase 6, Lahore",
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
    { projectIdx: 0, unitNumber: "A-001", name: "Apartment A", propertyType: "apartment", area: "1400", price: "15000000", status: "available", bedrooms: 3, bathrooms: 2, facing: "Garden", cornerUnit: false },
    { projectIdx: 0, unitNumber: "A-002", name: "Apartment B", propertyType: "apartment", area: "1200", price: "13000000", status: "available", bedrooms: 2, bathrooms: 2, facing: "City View", cornerUnit: false },
    { projectIdx: 0, unitNumber: "OR-001", name: "Open Roof 1", propertyType: "openRoof", area: "2000", price: "18000000", status: "available", bedrooms: 0, bathrooms: 1, facing: "North", cornerUnit: false },
    { projectIdx: 0, unitNumber: "OR-002", name: "Open Roof 2", propertyType: "openRoof", area: "2500", price: "22000000", status: "booked", bedrooms: 0, bathrooms: 1, facing: "West", cornerUnit: true },
    { projectIdx: 1, unitNumber: "S-001", name: "Shop 1", propertyType: "shop", area: "800", price: "12000000", status: "available", bedrooms: 0, bathrooms: 1, facing: "Main Road", cornerUnit: false },
    { projectIdx: 1, unitNumber: "S-002", name: "Shop 2", propertyType: "shop", area: "750", price: "11000000", status: "sold", bedrooms: 0, bathrooms: 1, facing: "Main Road", cornerUnit: false },
    { projectIdx: 2, unitNumber: "PH-101", name: "Pent House 101", propertyType: "pentHouse", area: "3500", price: "45000000", status: "available", bedrooms: 4, bathrooms: 3, facing: "Panoramic", cornerUnit: true },
    { projectIdx: 2, unitNumber: "PH-102", name: "Pent House 102", propertyType: "pentHouse", area: "3800", price: "50000000", status: "available", bedrooms: 4, bathrooms: 4, facing: "City View", cornerUnit: false },
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
  console.log("   Admin: admin@buildhub.com / admin123");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
