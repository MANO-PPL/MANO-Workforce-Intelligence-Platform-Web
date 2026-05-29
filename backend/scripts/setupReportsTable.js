import { adminDB, attendanceDB } from '../src/config/database.js';

async function main() {
  const db = adminDB || attendanceDB;
  try {
    const hasTable = await db.schema.hasTable('generated_reports');
    if (!hasTable) {
      console.log('Creating "generated_reports" table...');
      await db.schema.createTable('generated_reports', (table) => {
        table.string('report_id', 255).primary();
        table.integer('user_id').notNullable();
        table.integer('org_id').notNullable();
        table.string('report_type', 100).notNullable();
        table.string('format', 10).notNullable();
        table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
        table.text('file_url').nullable();
        table.string('error_message', 255).nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ "generated_reports" table created successfully.');
    } else {
      console.log('ℹ️ "generated_reports" table already exists.');
    }
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    if (adminDB) await adminDB.destroy();
    await attendanceDB.destroy();
  }
}

main();
