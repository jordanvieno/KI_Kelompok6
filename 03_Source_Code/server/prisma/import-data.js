/**
 * Import Data ke PostgreSQL (Supabase)
 * 
 * Script ini membaca file JSON yang di-export dari SQLite
 * dan mengimport-nya ke database PostgreSQL baru.
 * 
 * Jalankan SETELAH:
 *   1. DATABASE_URL sudah mengarah ke Supabase PostgreSQL
 *   2. npx prisma db push (schema sudah di-push)
 * 
 * Perintah: node prisma/import-data.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  const dataPath = path.join(__dirname, 'exported-data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ File exported-data.json tidak ditemukan!');
    console.error('   Jalankan dulu: node prisma/export-data.js');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log('📥 Importing data to PostgreSQL...\n');

  try {
    // Clear existing data (in reverse dependency order)
    console.log('  🗑️  Clearing existing data...');
    await prisma.authorizationEvent.deleteMany();
    await prisma.authEvent.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.otpCode.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.aspiration.deleteMany();
    await prisma.article.deleteMany();
    await prisma.documentation.deleteMany();
    await prisma.operation.deleteMany();
    await prisma.user.deleteMany();

    // Import Users
    if (data.users?.length > 0) {
      for (const user of data.users) {
        await prisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
      }
      console.log(`  ✅ Users: ${data.users.length} imported`);
    }

    // Reset auto-increment sequence for users
    if (data.users?.length > 0) {
      const maxUserId = Math.max(...data.users.map(u => u.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"User_id_seq"', ${maxUserId}, true)`);
    }

    // Import Articles
    if (data.articles?.length > 0) {
      for (const article of data.articles) {
        await prisma.article.create({
          data: {
            id: article.id,
            name: article.name,
            content: article.content,
            date: new Date(article.date),
            author: article.author,
            imagePath: article.imagePath,
            isDraft: article.isDraft,
            status: article.status || 'draft',
            submittedBy: article.submittedBy,
            reviewedBy: article.reviewedBy,
            reviewNote: article.reviewNote,
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt),
          },
        });
      }
      const maxArticleId = Math.max(...data.articles.map(a => a.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"Article_id_seq"', ${maxArticleId}, true)`);
      console.log(`  ✅ Articles: ${data.articles.length} imported`);
    }

    // Import Comments
    if (data.comments?.length > 0) {
      for (const comment of data.comments) {
        await prisma.comment.create({
          data: {
            id: comment.id,
            content: comment.content,
            articleId: comment.articleId,
            userId: comment.userId,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          },
        });
      }
      const maxCommentId = Math.max(...data.comments.map(c => c.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"Comment_id_seq"', ${maxCommentId}, true)`);
      console.log(`  ✅ Comments: ${data.comments.length} imported`);
    }

    // Import Aspirations
    if (data.aspirations?.length > 0) {
      for (const asp of data.aspirations) {
        await prisma.aspiration.create({
          data: {
            id: asp.id,
            title: asp.title,
            description: asp.description,
            category: asp.category,
            location: asp.location,
            imagePath: asp.imagePath,
            status: asp.status,
            priority: asp.priority,
            userId: asp.userId,
            adminNote: asp.adminNote,
            resolvedAt: asp.resolvedAt ? new Date(asp.resolvedAt) : null,
            createdAt: new Date(asp.createdAt),
            updatedAt: new Date(asp.updatedAt),
          },
        });
      }
      const maxAspId = Math.max(...data.aspirations.map(a => a.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"Aspiration_id_seq"', ${maxAspId}, true)`);
      console.log(`  ✅ Aspirations: ${data.aspirations.length} imported`);
    }

    // Import Documentation
    if (data.documentation?.length > 0) {
      for (const doc of data.documentation) {
        await prisma.documentation.create({
          data: {
            id: doc.id,
            photoPath: doc.photoPath,
            description: doc.description,
            date: new Date(doc.date),
            documentHash: doc.documentHash,
            digitalSignature: doc.digitalSignature,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
          },
        });
      }
      const maxDocId = Math.max(...data.documentation.map(d => d.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"Documentation_id_seq"', ${maxDocId}, true)`);
      console.log(`  ✅ Documentation: ${data.documentation.length} imported`);
    }

    // Import Operations
    if (data.operations?.length > 0) {
      for (const op of data.operations) {
        await prisma.operation.create({
          data: {
            id: op.id,
            category: op.category,
            value: op.value,
            maxValue: op.maxValue,
          },
        });
      }
      const maxOpId = Math.max(...data.operations.map(o => o.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"Operation_id_seq"', ${maxOpId}, true)`);
      console.log(`  ✅ Operations: ${data.operations.length} imported`);
    }

    // Import OTP Codes (skip - ephemeral data, usually not needed)
    console.log(`  ⏭️  OTP Codes: Skipped (ephemeral data)`);

    // Import Audit Logs
    if (data.auditLogs?.length > 0) {
      // Batch insert for performance
      for (let i = 0; i < data.auditLogs.length; i += 50) {
        const batch = data.auditLogs.slice(i, i + 50);
        await prisma.auditLog.createMany({
          data: batch.map(log => ({
            id: log.id,
            userId: log.userId,
            action: log.action,
            resource: log.resource,
            details: log.details,
            ipAddress: log.ipAddress,
            ipAddressIv: log.ipAddressIv,
            userAgent: log.userAgent,
            timestamp: new Date(log.timestamp),
          })),
        });
      }
      const maxAuditId = Math.max(...data.auditLogs.map(l => l.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"AuditLog_id_seq"', ${maxAuditId}, true)`);
      console.log(`  ✅ Audit Logs: ${data.auditLogs.length} imported`);
    }

    // Import Auth Events
    if (data.authEvents?.length > 0) {
      for (let i = 0; i < data.authEvents.length; i += 50) {
        const batch = data.authEvents.slice(i, i + 50);
        await prisma.authEvent.createMany({
          data: batch.map(event => ({
            id: event.id,
            userId: event.userId,
            email: event.email,
            eventType: event.eventType,
            ipAddress: event.ipAddress,
            ipAddressIv: event.ipAddressIv,
            userAgent: event.userAgent,
            timestamp: new Date(event.timestamp),
          })),
        });
      }
      const maxAuthEventId = Math.max(...data.authEvents.map(e => e.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"AuthEvent_id_seq"', ${maxAuthEventId}, true)`);
      console.log(`  ✅ Auth Events: ${data.authEvents.length} imported`);
    }

    // Import Authorization Events
    if (data.authorizationEvents?.length > 0) {
      for (let i = 0; i < data.authorizationEvents.length; i += 50) {
        const batch = data.authorizationEvents.slice(i, i + 50);
        await prisma.authorizationEvent.createMany({
          data: batch.map(event => ({
            id: event.id,
            userId: event.userId,
            route: event.route,
            method: event.method,
            role: event.role,
            allowed: event.allowed,
            timestamp: new Date(event.timestamp),
          })),
        });
      }
      const maxAuthzId = Math.max(...data.authorizationEvents.map(e => e.id));
      await prisma.$executeRawUnsafe(`SELECT setval('"AuthorizationEvent_id_seq"', ${maxAuthzId}, true)`);
      console.log(`  ✅ Authorization Events: ${data.authorizationEvents.length} imported`);
    }

    console.log('\n🎉 Data import completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Users: ${data.users?.length || 0}`);
    console.log(`   Articles: ${data.articles?.length || 0}`);
    console.log(`   Comments: ${data.comments?.length || 0}`);
    console.log(`   Aspirations: ${data.aspirations?.length || 0}`);
    console.log(`   Documentation: ${data.documentation?.length || 0}`);
    console.log(`   Operations: ${data.operations?.length || 0}`);
    console.log(`   Audit Logs: ${data.auditLogs?.length || 0}`);
    console.log(`   Auth Events: ${data.authEvents?.length || 0}`);
    console.log(`   Authorization Events: ${data.authorizationEvents?.length || 0}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
