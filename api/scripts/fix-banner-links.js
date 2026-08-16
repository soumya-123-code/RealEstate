import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeLink(raw) {
  if (!raw || typeof raw !== "string") return "/list";
  let link = raw.trim();
  if (!link.startsWith("/") || link.startsWith("//") || link.includes("://")) {
    return "/list";
  }
  if (
    link === "/properties" ||
    link.startsWith("/properties?") ||
    link.startsWith("/properties/")
  ) {
    link = link.replace(/^\/properties/, "/list");
  }
  link = link.replace(/([?&])type=/, "$1propertyType=");
  return link || "/list";
}

async function main() {
  const banners = await prisma.heroBanner.findMany();
  for (const banner of banners) {
    const next = normalizeLink(banner.buttonLink);
    if (next !== banner.buttonLink) {
      await prisma.heroBanner.update({
        where: { id: banner.id },
        data: { buttonLink: next },
      });
      console.log(`${banner.id}: ${banner.buttonLink} -> ${next}`);
    } else {
      console.log(`${banner.id}: ok ${banner.buttonLink}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
