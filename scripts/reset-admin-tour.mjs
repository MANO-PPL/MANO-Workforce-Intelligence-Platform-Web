import { attendanceDB } from '../backend/src/config/database.js';

attendanceDB('users').where('email', 'admin@demo.com').update({ pages_tour_seen: '{}' })
    .then(() => attendanceDB('users').select('email', 'pages_tour_seen').where('email', 'admin@demo.com').first())
    .then((row) => {
        console.log('Database reset complete. Current state:', row);
    })
    .catch((err) => {
        console.error('Failed to reset database:', err);
    })
    .finally(() => process.exit(0));
