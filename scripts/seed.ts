// Mystic AI — Database Seed
// Bootstraps the Super Admin account and default provider configs.
// Run with: bun run scripts/seed.ts

import { db } from "../src/lib/db";
import { scryptSync, randomBytes } from "crypto";

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  console.log("🌱 Seeding Mystic AI database...");

  // Create Super Admin — credentials MUST come from environment, never hardcoded
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminName = process.env.ADMIN_NAME || "Mystic Admin";

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars. Set them in .env before running seed."
    );
  }

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await hashPassword(adminPassword);
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true },
    });
    console.log(`✅ Created Super Admin: ${admin.email} (${admin.role})`);
  } else {
    // Update existing admin to ensure correct role and password
    const passwordHash = await hashPassword(adminPassword);
    await db.user.update({
      where: { email: adminEmail },
      data: { role: "SUPER_ADMIN", status: "ACTIVE", passwordHash },
    });
    console.log(`✅ Updated existing admin: ${adminEmail} → SUPER_ADMIN`);
  }

  // Seed ProviderConfig records (no secrets — only metadata)
  const providers = [
    { name: "CLAUDE", displayName: "Claude (Anthropic)", enabled: true, connected: false },
    { name: "GEMINI", displayName: "Gemini (Google)", enabled: true, connected: false },
    { name: "GLM", displayName: "GLM (Z.ai)", enabled: true, connected: true },
    { name: "CODEX", displayName: "Codex (OpenAI)", enabled: true, connected: false },
    { name: "RESEARCH", displayName: "Research (Web)", enabled: true, connected: true },
  ];

  for (const p of providers) {
    const existing = await db.providerConfig.findUnique({ where: { name: p.name } });
    if (!existing) {
      await db.providerConfig.create({
        data: {
          name: p.name,
          displayName: p.displayName,
          enabled: p.enabled,
          connected: p.connected,
          lastChecked: p.connected ? new Date() : null,
          configJson: JSON.stringify({ models: [], capabilities: [] }),
        },
      });
      console.log(`  • Provider: ${p.name} (${p.connected ? "connected" : "needs config"})`);
    } else {
      console.log(`  • Provider: ${p.name} (already exists)`);
    }
  }

  // Create an audit log entry
  const adminUser = await db.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "SYSTEM_SEED",
        target: "database",
        details: JSON.stringify({ message: "Database seeded with admin and providers" }),
      },
    });
  }

  console.log("\n🎉 Seed complete!");
  console.log(`   Admin: ${adminEmail}`);
  console.log(`   Role: SUPER_ADMIN`);
  console.log(`   Providers configured: ${providers.length}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
