import { NextResponse } from 'next/server';
import { runQuery, toNum } from '@/lib/neo4j';

export async function GET() {
  try {
    const records = await runQuery(
      'MATCH (g:GPU) RETURN g.name AS name, g.ranking AS ranking ORDER BY g.ranking ASC'
    );
    const gpus = records.map(r => ({
      name: r.get('name'),
      ranking: toNum(r.get('ranking')),
    }));
    return NextResponse.json({ gpus });
  } catch (err) {
    console.error('GPU list error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
