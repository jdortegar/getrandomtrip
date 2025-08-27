import { PrismaClient } from '@prisma/client';
// NOTA: En un monorepo real, estos datos estarían en un paquete compartido.
// Por ahora, accedemos a ellos con una ruta relativa.
import { allDestinations } from '../../frontend/src/content/bitacoras';

const prisma = new PrismaClient();

async function main() {
  console.log(`Limpiando la base de datos...`);
  // Borramos en orden inverso para evitar problemas de foreign key constraints
  await prisma.faq.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.whenToGo.deleteMany();
  await prisma.country.deleteMany();

  console.log(`Comenzando el seeding...`);

  for (const dest of allDestinations) {
    const country = await prisma.country.create({
      data: {
        slug: dest.slug,
        name: dest.name,
        seoTitle: dest.seoTitle,
        seoDescription: dest.seoDescription,
        h1: dest.h1,
        heroKicker: dest.heroKicker,
        heroHeadline: dest.heroHeadline,
        heroSub: dest.heroSub,
        ctaLabel: dest.ctaLabel,
        heroImage: dest.heroImage,
        reasonsToGo: dest.reasonsToGo,
        bestFor: dest.bestFor,
        signatureExperiences: dest.signatureExperiences,
        gallery: dest.gallery || [],
        whenToGo: { create: dest.whenToGo },
        ideas: { create: dest.ideas },
        faqs: { create: dest.faqs },
      },
    });
    console.log(`Creado destino: ${country.name} (ID: ${country.id})`);
  }
  console.log(`Seeding finalizado.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });