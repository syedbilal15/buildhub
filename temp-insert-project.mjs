import { db } from './src/db/index.ts';
import { projects, units } from './src/db/schema.ts';
import { and, eq } from 'drizzle-orm';

const projectPayload = {
  name: 'Build Hub Garden Estate',
  projectCode: 'BHGE-001',
  location: 'Karachi',
  description: 'Developer: Build Hub Developers',
  status: 'active',
  launchDate: null,
  completionDate: null,
  amenities: [],
};

async function main() {
  const existingProject = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, projectPayload.name))
    .limit(1);

  let projectId;
  if (existingProject.length > 0) {
    projectId = existingProject[0].id;
    console.log('Project already exists with id ' + projectId);
  } else {
    const [newProject] = await db.insert(projects).values(projectPayload).returning();
    projectId = newProject.id;
    console.log('Created project with id ' + projectId);
  }

  const unitsToCreate = [
    {
      unitNumber: '101',
      name: 'Unit #101',
      propertyType: 'residential',
      area: '120',
      areaUnit: 'sq yards',
      price: '5000000',
      status: 'available',
    },
    {
      unitNumber: '102',
      name: 'Unit #102',
      propertyType: 'commercial',
      area: '80',
      areaUnit: 'sq yards',
      price: '7500000',
      status: 'available',
    },
  ];

  let createdUnits = 0;
  for (const unit of unitsToCreate) {
    const existingUnit = await db
      .select({ id: units.id })
      .from(units)
      .where(and(eq(units.projectId, projectId), eq(units.unitNumber, unit.unitNumber)))
      .limit(1);

    if (existingUnit.length > 0) {
      console.log('Unit ' + unit.unitNumber + ' already exists');
      continue;
    }

    await db.insert(units).values({ projectId, ...unit });
    createdUnits += 1;
    console.log('Created unit ' + unit.unitNumber);
  }

  console.log(JSON.stringify({ projectId, createdUnits }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
