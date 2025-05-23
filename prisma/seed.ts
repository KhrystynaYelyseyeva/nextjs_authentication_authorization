import { seedInitialUsers } from "@/lib/prisma-utils";

seedInitialUsers().then(() => console.log("Seeding complete!"));
