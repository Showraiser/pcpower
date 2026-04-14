import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { runQuery, toNum } from '@/lib/neo4j';
import { createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password, cpuName, gpuName, ram } = await request.json();

    if (!username || !password || !cpuName || !gpuName || !ram) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if username already exists
    const existing = await runQuery(
      'MATCH (u:User {username: $username}) RETURN u',
      { username }
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 400 });
    }

    // Validate CPU
    const cpuResult = await runQuery(
      'MATCH (c:CPU {name: $name}) RETURN c.ranking AS ranking',
      { name: cpuName }
    );
    if (cpuResult.length === 0) {
      return NextResponse.json({ error: 'CPU not found in database.' }, { status: 400 });
    }
    const cpuRanking = toNum(cpuResult[0].get('ranking'));

    // Validate GPU
    const gpuResult = await runQuery(
      'MATCH (g:GPU {name: $name}) RETURN g.ranking AS ranking',
      { name: gpuName }
    );
    if (gpuResult.length === 0) {
      return NextResponse.json({ error: 'GPU not found in database.' }, { status: 400 });
    }
    const gpuRanking = toNum(gpuResult[0].get('ranking'));

    const passwordHash = await bcrypt.hash(password, 10);
    const ramInt = parseInt(ram);

    // Create User node and connect via relationships to CPU and GPU
    await runQuery(`
      MATCH (c:CPU {name: $cpuName})
      MATCH (g:GPU {name: $gpuName})
      CREATE (u:User {username: $username, passwordHash: $passwordHash, ram: $ram})
      CREATE (u)-[:USES_CPU]->(c)
      CREATE (u)-[:USES_GPU]->(g)
    `, { username, passwordHash, cpuName, gpuName, ram: ramInt });

    const token = await createToken({ username, cpuRanking, gpuRanking, ram: ramInt });

    const response = NextResponse.json({ success: true, username });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
