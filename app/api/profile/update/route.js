import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { runQuery, toNum } from '@/lib/neo4j';
import { verifyToken, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(request) {
  try {
    const token = cookies().get('token')?.value;
    const userData = await verifyToken(token);
    const { field, currentPassword, newValue } = await request.json();

    if (!currentPassword || !newValue) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Verify current password first
    const userResult = await runQuery(
      'MATCH (u:User {username: $username}) RETURN u.passwordHash AS hash',
      { username: userData.username }
    );
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const isValid = await bcrypt.compare(currentPassword, userResult[0].get('hash'));
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });
    }

    let newToken = null;

    switch (field) {
      case 'username': {
        const exists = await runQuery(
          'MATCH (u:User {username: $username}) RETURN u',
          { username: newValue }
        );
        if (exists.length > 0) {
          return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
        }
        await runQuery(
          'MATCH (u:User {username: $old}) SET u.username = $new',
          { old: userData.username, new: newValue }
        );
        // Re-read rankings for new token
        const updated = await runQuery(`
          MATCH (u:User {username: $username})-[:USES_CPU]->(c:CPU)
          MATCH (u)-[:USES_GPU]->(g:GPU)
          RETURN u.ram AS ram, c.ranking AS cpuRanking, g.ranking AS gpuRanking
        `, { username: newValue });
        const ur = updated[0];
        newToken = await createToken({
          username: newValue,
          cpuRanking: toNum(ur.get('cpuRanking')),
          gpuRanking: toNum(ur.get('gpuRanking')),
          ram: toNum(ur.get('ram')),
        });
        break;
      }

      case 'password': {
        const newHash = await bcrypt.hash(newValue, 10);
        await runQuery(
          'MATCH (u:User {username: $username}) SET u.passwordHash = $hash',
          { username: userData.username, hash: newHash }
        );
        break;
      }

      case 'cpu': {
        const cpuResult = await runQuery(
          'MATCH (c:CPU {name: $name}) RETURN c.ranking AS ranking',
          { name: newValue }
        );
        if (cpuResult.length === 0) {
          return NextResponse.json({ error: 'CPU not found.' }, { status: 400 });
        }
        const newCpuRank = toNum(cpuResult[0].get('ranking'));
        // Delete old USES_CPU edge, create new one
        await runQuery(`
          MATCH (u:User {username: $username})-[r:USES_CPU]->(:CPU)
          MATCH (newC:CPU {name: $cpuName})
          DELETE r
          CREATE (u)-[:USES_CPU]->(newC)
        `, { username: userData.username, cpuName: newValue });
        const gpuData = await runQuery(`
          MATCH (u:User {username: $username})-[:USES_GPU]->(g:GPU)
          RETURN g.ranking AS gpuRanking, u.ram AS ram
        `, { username: userData.username });
        newToken = await createToken({
          username: userData.username,
          cpuRanking: newCpuRank,
          gpuRanking: toNum(gpuData[0].get('gpuRanking')),
          ram: toNum(gpuData[0].get('ram')),
        });
        break;
      }

      case 'gpu': {
        const gpuResult = await runQuery(
          'MATCH (g:GPU {name: $name}) RETURN g.ranking AS ranking',
          { name: newValue }
        );
        if (gpuResult.length === 0) {
          return NextResponse.json({ error: 'GPU not found.' }, { status: 400 });
        }
        const newGpuRank = toNum(gpuResult[0].get('ranking'));
        // Delete old USES_GPU edge, create new one
        await runQuery(`
          MATCH (u:User {username: $username})-[r:USES_GPU]->(:GPU)
          MATCH (newG:GPU {name: $gpuName})
          DELETE r
          CREATE (u)-[:USES_GPU]->(newG)
        `, { username: userData.username, gpuName: newValue });
        const cpuData = await runQuery(`
          MATCH (u:User {username: $username})-[:USES_CPU]->(c:CPU)
          RETURN c.ranking AS cpuRanking, u.ram AS ram
        `, { username: userData.username });
        newToken = await createToken({
          username: userData.username,
          cpuRanking: toNum(cpuData[0].get('cpuRanking')),
          gpuRanking: newGpuRank,
          ram: toNum(cpuData[0].get('ram')),
        });
        break;
      }

      case 'ram': {
        const newRam = parseInt(newValue);
        if (isNaN(newRam) || newRam < 1) {
          return NextResponse.json({ error: 'Invalid RAM value.' }, { status: 400 });
        }
        await runQuery(
          'MATCH (u:User {username: $username}) SET u.ram = $ram',
          { username: userData.username, ram: newRam }
        );
        newToken = await createToken({
          username: userData.username,
          cpuRanking: userData.cpuRanking,
          gpuRanking: userData.gpuRanking,
          ram: newRam,
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid field.' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    if (newToken) {
      response.cookies.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return response;
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
