import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@dixy.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME || "Главный модератор";

  const userPassword = await bcrypt.hash("User12345!", 10);
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, role: "ADMIN", passwordHash: adminHash },
    create: { name: adminName, email: adminEmail, role: "ADMIN", passwordHash: adminHash }
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@dixy.local" },
    update: { name: "Демо пользователь", passwordHash: userPassword },
    create: { name: "Демо пользователь", email: "demo@dixy.local", passwordHash: userPassword }
  });

  if ((await prisma.idea.count()) > 0) return;

  const idea1 = await prisma.idea.create({
    data: {
      title: "Яркий пакет с овощным паттерном",
      description: "Серия ярких принтов для фирменных пакетов: овощи, фрукты, слоганы и летняя цветовая палитра.",
      imagePath: "/demo/bag.svg",
      status: "APPROVED",
      publishedAt: new Date(),
      moderatedAt: new Date(),
      voteCount: 2,
      submitterId: demoUser.id,
      moderatorId: admin.id,
      tags: { create: ["Пакет", "Экосумка", "Мерч"].map((label) => ({ label })) }
    }
  });

  const idea2 = await prisma.idea.create({
    data: {
      title: "Новый фасад с крупной навигацией",
      description: "Концепт фасада Дикси с яркими блоками, ценовыми акцентами и понятными зонами категорий.",
      imagePath: "/demo/facade.svg",
      status: "APPROVED",
      publishedAt: new Date(),
      moderatedAt: new Date(),
      voteCount: 1,
      submitterId: demoUser.id,
      moderatorId: admin.id,
      tags: { create: ["Фасад здания", "Витрина", "Промо-стойка"].map((label) => ({ label })) }
    }
  });

  await prisma.idea.create({
    data: {
      title: "Игрушка-талисман Лисёнок",
      description: "Мягкая коллекционная игрушка для сезонных промо и детских подарочных наборов.",
      imagePath: "/demo/toy.svg",
      status: "PENDING",
      submitterId: demoUser.id,
      tags: { create: ["Новая игрушка", "Мерч"].map((label) => ({ label })) }
    }
  });

  await prisma.vote.createMany({
    data: [
      { ideaId: idea1.id, userId: demoUser.id },
      { ideaId: idea1.id, userId: admin.id },
      { ideaId: idea2.id, userId: admin.id }
    ]
  });

  await prisma.comment.createMany({
    data: [
      { ideaId: idea1.id, userId: admin.id, content: "Хорошая идея. Такой пакет реально будет заметным в магазине." },
      { ideaId: idea1.id, userId: demoUser.id, content: "Можно сделать ещё сезонную зимнюю версию." }
    ]
  });

  await prisma.idea.update({ where: { id: idea1.id }, data: { commentsCount: 2 } });

  console.log("Seed completed");
  console.log("Admin:", adminEmail, adminPassword);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
