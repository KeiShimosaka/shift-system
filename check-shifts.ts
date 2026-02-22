import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function checkShifts() {
    console.log('Fetching all shifts from DB...');
    const shifts = await sql`SELECT * FROM "Shift"`;
    console.log(`Found ${shifts.length} shifts.`);

    const marchShifts = shifts.filter(s => s.date && s.date.includes('-3-'));
    console.log(`March shifts (${marchShifts.length}):`);

    const savedTimes = marchShifts.filter(s => s.time !== null);
    console.log(`March shifts with times assigned (${savedTimes.length}):`, savedTimes);

}

checkShifts().catch(e => {
    console.error(e);
});
