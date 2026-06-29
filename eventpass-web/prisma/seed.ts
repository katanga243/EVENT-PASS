import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { PrismaClient, City, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../src/backend/password";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const events = [
  {
    title: "Notte Elettronica",
    description:
      "Milano's biggest underground electronic music night. Four stages, ten hours, the best DJs from across Europe take over Fabrique for an unmissable experience.",
    venueName: "Fabrique",
    city: City.MILANO,
    startsAt: new Date("2026-07-12T22:00:00"),
    imageUrl: "/events/notte-elettronica.jpg",
    ticketTypes: [
      { name: "General Admission", priceCents: 2500, gate: "B", quantity: 600 },
      { name: "VIP", priceCents: 6000, gate: "A", quantity: 100 },
    ],
  },
  {
    title: "Milano Tech Summit",
    description:
      "Two days of keynotes, workshops, and networking with founders, investors, and engineers shaping Europe's tech landscape. Hosted at the iconic Talent Garden.",
    venueName: "Talent Garden Milano",
    city: City.MILANO,
    startsAt: new Date("2026-09-05T09:00:00"),
    imageUrl: "/events/milano-tech-summit.jpg",
    ticketTypes: [
      { name: "Standard Pass", priceCents: 3500, gate: "B", quantity: 400 },
      { name: "Pro Pass", priceCents: 8500, gate: "A", quantity: 80 },
    ],
  },
  {
    title: "Blue Note Jazz Night",
    description:
      "An intimate evening of live jazz at Milano's legendary Blue Note club. Featuring international headliners and the finest Italian jazz talent in an unforgettable atmosphere.",
    venueName: "Blue Note Milano",
    city: City.MILANO,
    startsAt: new Date("2026-08-01T20:30:00"),
    imageUrl: "/events/blue-note-jazz-night.jpg",
    ticketTypes: [
      { name: "General", priceCents: 3000, gate: "B", quantity: 200 },
      { name: "VIP Table", priceCents: 7500, gate: "A", quantity: 40 },
    ],
  },
  {
    title: "Torino Sound Festival",
    description:
      "Three days of music across five open-air stages in the heart of Torino. From indie to electronic, hip-hop to funk — the city's biggest summer music celebration.",
    venueName: "Parco del Valentino",
    city: City.TORINO,
    startsAt: new Date("2026-07-25T16:00:00"),
    imageUrl: "/events/torino-sound-festival.jpg",
    ticketTypes: [
      { name: "Day Pass", priceCents: 2000, gate: "C", quantity: 800 },
      { name: "Weekend Pass", priceCents: 5000, gate: "B", quantity: 400 },
      { name: "VIP Weekend", priceCents: 10000, gate: "A", quantity: 60 },
    ],
  },
  {
    title: "Startup Night Torino",
    description:
      "Pitch competitions, investor meetups, and product demos in the spectacular setting of OGR Torino. The north-west's premier startup networking event.",
    venueName: "OGR Torino",
    city: City.TORINO,
    startsAt: new Date("2026-10-15T18:00:00"),
    imageUrl: "/events/startup-night-torino.jpg",
    ticketTypes: [
      { name: "General", priceCents: 1000, gate: "B", quantity: 300 },
      { name: "VIP", priceCents: 3000, gate: "A", quantity: 50 },
    ],
  },
  {
    title: "Cinema sotto le Stelle",
    description:
      "Open-air cinema under the stars in Piazza Castello. A curated selection of international films and Italian classics, with food and drink from Torino's best producers.",
    venueName: "Piazza Castello",
    city: City.TORINO,
    startsAt: new Date("2026-08-20T21:00:00"),
    imageUrl: "/events/cinema-sotto-le-stelle.jpg",
    ticketTypes: [
      { name: "General", priceCents: 800, gate: "B", quantity: 500 },
      { name: "Premium (deck chair + blanket)", priceCents: 1500, gate: "A", quantity: 100 },
    ],
  },
];

async function main() {
  console.log("Seeding database…");

  const organiser = await prisma.user.upsert({
    where: { email: "organiser@eventpass.demo" },
    update: {},
    create: {
      name: "EventPass Demo",
      email: "organiser@eventpass.demo",
      passwordHash: await hashPassword("demo1234"),
      role: Role.ORGANISER,
    },
  });

  await prisma.user.upsert({
    where: { email: "buyer@eventpass.demo" },
    update: {},
    create: {
      name: "Jean Dedieu",
      email: "buyer@eventpass.demo",
      passwordHash: await hashPassword("demo1234"),
      role: Role.BUYER,
    },
  });

  for (const ev of events) {
    const { ticketTypes, ...eventData } = ev;
    const slug = eventData.title.toLowerCase().replace(/\s+/g, "-");

    const event = await prisma.event.upsert({
      where: { id: slug },
      update: {},
      create: {
        id: slug,
        ...eventData,
        ownerId: organiser.id,
        ticketTypes: { create: ticketTypes },
      },
      include: { ticketTypes: true },
    });

    for (const tier of event.ticketTypes) {
      const seatCount = await prisma.seat.count({ where: { ticketTypeId: tier.id } });
      if (seatCount > 0) continue;

      await prisma.seat.createMany({
        data: Array.from({ length: tier.quantity }, (_, i) => ({
          ticketTypeId: tier.id,
          eventId: event.id,
          label: `${tier.gate}-${i + 1}`,
        })),
      });
    }

    console.log(`  ✓ ${event.title} (${event.city})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());