import { adminDB, attendanceDB } from './database.js';

export const initDatabase = async () => {
    try {
        const db = adminDB || attendanceDB;
        if (!db) {
            console.error('No database connection found for initialization.');
            return;
        }

        // 1. Initialize chat_rooms
        try {
            await db.schema.dropTableIfExists('chat_room_members');
            await db.schema.dropTableIfExists('chat_messages');
        } catch (dropErr) {
            // Ignore silently if permission lacks
        }

        const hasRooms = await db.schema.hasTable('chat_rooms');
        if (hasRooms) {
            const hasMessagesCol = await db.schema.hasColumn('chat_rooms', 'messages');
            if (!hasMessagesCol) {
                try {
                    await db.schema.dropTable('chat_rooms');
                    console.log('Old chat_rooms table dropped for single-row optimization.');
                } catch (dropErr) {
                    console.warn('⚠️ Unable to drop legacy chat_rooms table.');
                }
            }
        }

        const hasRoomsUpdated = await db.schema.hasTable('chat_rooms');
        if (!hasRoomsUpdated) {
            await db.schema.createTable('chat_rooms', (table) => {
                table.increments('room_id').primary();
                table.integer('org_id').unsigned().notNullable();
                table.string('room_name', 255).nullable();
                table.enum('room_type', ['direct', 'group']).defaultTo('direct');
                table.integer('created_by').unsigned().nullable();
                table.text('member_ids').notNullable();
                table.text('messages', 'longtext').notNullable();
                table.text('last_read_times').notNullable();
                table.text('removed_members').nullable();
                table.timestamps(true, true);

                table.index(['org_id']);
            });
            console.log('✅ Table "chat_rooms" initialized.');
        } else {
            const hasRemovedMembers = await db.schema.hasColumn('chat_rooms', 'removed_members');
            if (!hasRemovedMembers) {
                await db.schema.table('chat_rooms', (table) => {
                    table.text('removed_members').nullable();
                });
                console.log('Column "removed_members" added to "chat_rooms" successfully.');
            }
        }

        // 2. Initialize generated_reports
        const hasReports = await db.schema.hasTable('generated_reports');
        if (!hasReports) {
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
            console.log('✅ "generated_reports" table initialized.');
        }

        // 3. Initialize user_fcm_tokens
        const hasFcm = await db.schema.hasTable('user_fcm_tokens');
        if (!hasFcm) {
            console.log('Creating "user_fcm_tokens" table...');
            await db.schema.createTable('user_fcm_tokens', (table) => {
                table.increments('id').primary();
                table.integer('user_id').notNullable();
                table.string('token', 500).notNullable().unique();
                table.string('device_type', 50).nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.timestamp('updated_at').defaultTo(db.fn.now());

                table.index(['user_id']);
            });
            console.log('✅ "user_fcm_tokens" table initialized.');
        }

        // 4. Initialize recruitment_openings
        const hasRecruitmentOpenings = await db.schema.hasTable('recruitment_openings');
        if (!hasRecruitmentOpenings) {
            console.log('Creating "recruitment_openings" table...');
            await db.schema.createTable('recruitment_openings', (table) => {
                table.increments('id').primary();
                table.integer('org_id').unsigned().notNullable();
                table.string('job_title', 255).notNullable();
                table.string('slug', 255).notNullable().unique();
                table.string('department', 100).notNullable();
                table.string('location', 255).notNullable();
                table.string('employment_type', 50).defaultTo('Full-time');
                table.string('experience_required', 100).nullable();
                table.string('salary_range', 100).nullable();
                table.text('skills_required').nullable();
                table.text('responsibilities').nullable();
                table.text('benefits').nullable();
                table.date('deadline').nullable();
                table.enum('status', ['active', 'inactive']).defaultTo('active');
                table.text('form_config', 'longtext').nullable(); // JSON configuration for dynamic forms
                table.string('template_id', 100).nullable();
                table.enum('template_source', ['predefined', 'custom', 'scratch']).defaultTo('scratch');
                table.integer('created_by').unsigned().nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.timestamp('updated_at').defaultTo(db.fn.now());

                table.index(['org_id']);
                table.index(['slug']);
            });
            console.log('✅ "recruitment_openings" table initialized.');
        }

        // 5. Initialize recruitment_pipeline_stages
        const hasRecruitmentStages = await db.schema.hasTable('recruitment_pipeline_stages');
        if (!hasRecruitmentStages) {
            console.log('Creating "recruitment_pipeline_stages" table...');
            await db.schema.createTable('recruitment_pipeline_stages', (table) => {
                table.string('id', 100).primary();
                table.integer('org_id').unsigned().notNullable();
                table.string('name', 100).notNullable();
                table.string('color', 50).defaultTo('slate');
                table.integer('sort_order').defaultTo(0);
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.timestamp('updated_at').defaultTo(db.fn.now());

                table.index(['org_id']);
            });
            console.log('✅ "recruitment_pipeline_stages" table initialized.');
        }

        // 6. Initialize recruitment_form_templates
        const hasRecruitmentTemplates = await db.schema.hasTable('recruitment_form_templates');
        if (!hasRecruitmentTemplates) {
            console.log('Creating "recruitment_form_templates" table...');
            await db.schema.createTable('recruitment_form_templates', (table) => {
                table.string('id', 100).primary();
                table.integer('org_id').unsigned().nullable(); // null for global predefined templates
                table.string('name', 255).notNullable();
                table.text('description').nullable();
                table.text('fields', 'longtext').notNullable(); // JSON list of template components
                table.timestamp('created_at').defaultTo(db.fn.now());

                table.index(['org_id']);
            });
            console.log('✅ "recruitment_form_templates" table initialized.');
        }

        // 7. Initialize recruitment_candidates
        const hasRecruitmentCandidates = await db.schema.hasTable('recruitment_candidates');
        if (!hasRecruitmentCandidates) {
            console.log('Creating "recruitment_candidates" table...');
            await db.schema.createTable('recruitment_candidates', (table) => {
                table.increments('id').primary();
                table.integer('job_id').unsigned().notNullable();
                table.string('template_id', 100).nullable();
                table.enum('template_source', ['predefined', 'custom', 'scratch']).nullable();
                table.string('stage', 100).defaultTo('Applied');
                table.text('form_responses', 'longtext').notNullable(); // JSON responses containing all dynamic form data
                table.integer('ai_score').defaultTo(0);
                table.integer('skill_match_score').defaultTo(0);
                table.integer('experience_match_score').defaultTo(0);
                table.integer('education_match_score').defaultTo(0);
                table.integer('culture_fit_score').defaultTo(0);
                table.text('ai_strengths').nullable(); // JSON list
                table.text('ai_weaknesses').nullable(); // JSON list
                table.string('ai_recommendation', 255).nullable();
                table.text('extracted_skills').nullable(); // JSON list
                table.string('total_experience', 50).nullable();
                table.string('relevant_experience', 50).nullable();
                table.string('education', 255).nullable();
                table.text('certifications').nullable();
                table.text('projects').nullable();
                table.text('achievements').nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());

                table.index(['job_id']);
            });
            console.log('✅ "recruitment_candidates" table initialized.');
        }

    } catch (error) {
        console.error('Error during database table initialization:', error);
    }
};
