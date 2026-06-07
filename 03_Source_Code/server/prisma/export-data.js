/**
 * Export Data dari SQLite
 * 
 * Script ini membaca semua data dari database SQLite lama
 * dan menyimpannya ke file JSON untuk diimport ke PostgreSQL.
 * 
 * Jalankan SEBELUM mengubah DATABASE_URL ke PostgreSQL:
 *   node prisma/export-data.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  console.log('📦 Exporting data from current database...\n');

  try {
    // Export all tables
    const data = {};

    // Users
    data.users = await prisma.user.findMany();
    console.log(`  ✅ Users: ${data.users.length} records`);

    // Articles (with relations)
    data.articles = await prisma.article.findMany();
    console.log(`  ✅ Articles: ${data.articles.length} records`);

    // Comments
    data.comments = await prisma.comment.findMany();
    console.log(`  ✅ Comments: ${data.comments.length} records`);

    // Aspirations
    data.aspirations = await prisma.aspiration.findMany();
    console.log(`  ✅ Aspirations: ${data.aspirations.length} records`);

    // Documentation
    data.documentation = await prisma.documentation.findMany();
    console.log(`  ✅ Documentation: ${data.documentation.length} records`);

    // Operations
    data.operations = await prisma.operation.findMany();
    console.log(`  ✅ Operations: ${data.operations.length} records`);

    // OTP Codes
    data.otpCodes = await prisma.otpCode.findMany();
    console.log(`  ✅ OTP Codes: ${data.otpCodes.length} records`);

    // Audit Logs
    data.auditLogs = await prisma.auditLog.findMany();
    console.log(`  ✅ Audit Logs: ${data.auditLogs.length} records`);

    // Auth Events
    data.authEvents = await prisma.authEvent.findMany();
    console.log(`  ✅ Auth Events: ${data.authEvents.length} records`);

    // Authorization Events
    data.authorizationEvents = await prisma.authorizationEvent.findMany();
    console.log(`  ✅ Authorization Events: ${data.authorizationEvents.length} records`);

    // Save to JSON file
    const outputPath = path.join(__dirname, 'exported-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`\n🎉 Data exported successfully to: ${outputPath}`);
    console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
    console.log('\n📋 Next steps:');
    console.log('   1. Update DATABASE_URL in .env to your Supabase PostgreSQL connection string');
    console.log('   2. Run: npx prisma db push');
    console.log('   3. Run: node prisma/import-data.js');
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
