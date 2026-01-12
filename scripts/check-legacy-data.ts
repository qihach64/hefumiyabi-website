import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLegacyData() {
  console.log('=== Legacy Data Check ===\n');

  // Check CampaignPlan
  try {
    const campaignPlanCount = await prisma.campaignPlan.count();
    console.log(`CampaignPlan records: ${campaignPlanCount}`);
  } catch (e: any) {
    console.log('CampaignPlan: table not found or already removed');
  }

  // Check Listing
  try {
    const listingCount = await prisma.listing.count();
    console.log(`Listing records: ${listingCount}`);
  } catch (e: any) {
    console.log('Listing: table not found or already removed');
  }

  // Check CartItem with campaignPlanId
  try {
    const cartItemsWithCampaign = await prisma.cartItem.count({
      where: { campaignPlanId: { not: null } },
    });
    console.log(`CartItem with campaignPlanId: ${cartItemsWithCampaign}`);
  } catch (e: any) {
    console.log('CartItem.campaignPlanId: field not found or already removed');
  }

  // Check BookingItem with campaignPlanId
  try {
    const bookingItemsWithCampaign = await prisma.bookingItem.count({
      where: { campaignPlanId: { not: null } },
    });
    console.log(`BookingItem with campaignPlanId: ${bookingItemsWithCampaign}`);
  } catch (e: any) {
    console.log('BookingItem.campaignPlanId: field not found or already removed');
  }

  console.log('\n=== Check Complete ===');
}

checkLegacyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
