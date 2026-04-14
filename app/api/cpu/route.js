import { NextResponse } from 'next/server';
import { runQuery, toNum } from '@/lib/neo4j';

export async function GET() {
  try {
    const records = await runQuery(
      'MATCH (c:CPU) RETURN c.name AS name, c.ranking AS ranking ORDER BY c.ranking ASC'
    );
    const cpus = records.map(r => ({
      name: r.get('name'),
      ranking: toNum(r.get('ranking')),
    }));
    return NextResponse.json({ cpus });
  } catch (err) {
    console.error('CPU list error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
