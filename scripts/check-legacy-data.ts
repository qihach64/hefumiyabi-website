import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLegacyData() {
  console.log('=== Legacy Data Check ===\n');

  // Check Listing
  try {
    const listingCount = await prisma.listing.count();
    console.log(`Listing records: ${listingCount}`);
  } catch (e: any) {
    console.log('Listing: table not found or already removed');
  }

  console.log('\n=== Check Complete ===');
}

checkLegacyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
