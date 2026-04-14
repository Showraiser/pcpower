import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { runQuery, toNum } from '@/lib/neo4j';
import { createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    // Traverse graph: User -> CPU and User -> GPU in one query
    const result = await runQuery(`
      MATCH (u:User {username: $username})-[:USES_CPU]->(c:CPU)
      MATCH (u)-[:USES_GPU]->(g:GPU)
      RETURN u.passwordHash AS passwordHash,
             u.ram          AS ram,
             c.ranking      AS cpuRanking,
             g.ranking      AS gpuRanking
    `, { username });

    if (result.length === 0) {
      return NextResponse.json({ error: "Username doesn't exist." }, { status: 400 });
    }

    const record = result[0];
    const isValid = await bcrypt.compare(password, record.get('passwordHash'));

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });
    }

    const cpuRanking = toNum(record.get('cpuRanking'));
    const gpuRanking = toNum(record.get('gpuRanking'));
    const ram = toNum(record.get('ram'));

    const token = await createToken({ username, cpuRanking, gpuRanking, ram });

    const response = NextResponse.json({ success: true, username });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
