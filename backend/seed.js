// Seeds the database with an admin user + demo portfolio content.
// Run it with:  npm run seed
// It clears the relevant collections first, so it's safe to re-run.
require('dotenv').config();

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedData = require('./seed-data');

let mongodInstance = null;

async function main() {
  if (process.env.USE_IN_MEMORY_DB === 'true') {
    mongodInstance = await MongoMemoryServer.create();
    await mongoose.connect(mongodInstance.getUri());
    console.log('🗄️  Seeding into in-memory MongoDB (dev mode — will vanish on restart)');
  } else {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`🗄️  Seeding into ${process.env.MONGO_URI}`);
  }

  await seedData();

  await mongoose.disconnect();
  if (mongodInstance) await mongodInstance.stop(); // lets the script exit cleanly
  console.log('');
  console.log('✅ Seed complete. You can now log in with:');
  console.log(`   username: ${process.env.ADMIN_USERNAME || 'admin'}`);
  console.log(`   password: ${process.env.ADMIN_PASSWORD || 'change-me-in-prod-123'}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
