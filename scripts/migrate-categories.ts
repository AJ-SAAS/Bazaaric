// One-time migration: rewrites each listing's `category` field from the old
// display-string values ("Fashion", "Electronics", ...) to the new stable
// category IDs ("fashion", "electronics", ...) used everywhere in the app.
// Safe to re-run — any listing whose category is already a valid ID is
// left untouched.
//
// Run with: npx tsx scripts/migrate-categories.ts
// Make sure FIREBASE_SERVICE_ACCOUNT_KEY is loaded in your shell first —
// e.g. `npx dotenv -e .env.local -- npx tsx scripts/migrate-categories.ts`
// if you have dotenv-cli installed, or export it manually.

import { adminDb } from "../lib/firebase-admin";
import { CATEGORIES, LEGACY_CATEGORY_MAP } from "../lib/categories";

async function migrate() {
  const validIds = new Set(CATEGORIES.map((c) => c.id));
  const snapshot = await adminDb.collection("listings").get();

  let updated = 0;
  let alreadyOk = 0;
  const unrecognized: { id: string; category: string }[] = [];

  const BATCH_LIMIT = 400; // stay comfortably under Firestore's 500 writes/batch
  let batch = adminDb.batch();
  let opsInBatch = 0;

  for (const doc of snapshot.docs) {
    const currentCategory = doc.data().category;

    if (validIds.has(currentCategory)) {
      alreadyOk++;
      continue;
    }

    const mapped = LEGACY_CATEGORY_MAP[currentCategory];

    if (!mapped) {
      unrecognized.push({ id: doc.id, category: currentCategory });
      continue;
    }

    batch.update(doc.ref, { category: mapped });
    opsInBatch++;
    updated++;

    if (opsInBatch >= BATCH_LIMIT) {
      await batch.commit();
      batch = adminDb.batch();
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }

  console.log("Migration complete.");
  console.log(`  Updated:      ${updated}`);
  console.log(`  Already OK:   ${alreadyOk}`);
  console.log(`  Unrecognized: ${unrecognized.length}`);

  if (unrecognized.length > 0) {
    console.log("\nListings with a category value that didn't match any known mapping — left untouched, check manually:");
    unrecognized.forEach((u) => console.log(`  - ${u.id}: "${u.category}"`));
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });