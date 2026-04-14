import { NextResponse } from 'next/server';
import { runQuery, toNum } from '@/lib/neo4j';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    const userData = await verifyToken(token);

    // Graph traversal: User -> CPU and User -> GPU
    const result = await runQuery(`
      MATCH (u:User {username: $username})-[:USES_CPU]->(c:CPU)
      MATCH (u)-[:USES_GPU]->(g:GPU)
      RETURN u.username  AS username,
             u.ram       AS ram,
             c.name      AS cpuName,
             c.ranking   AS cpuRanking,
             g.name      AS gpuName,
             g.ranking   AS gpuRanking
    `, { username: userData.username });

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const r = result[0];
    return NextResponse.json({
      username:   r.get('username'),
      ram:        toNum(r.get('ram')),
      cpuName:    r.get('cpuName'),
      cpuRanking: toNum(r.get('cpuRanking')),
      gpuName:    r.get('gpuName'),
      gpuRanking: toNum(r.get('gpuRanking')),
    });
  } catch (err) {
    console.error('Profile error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
