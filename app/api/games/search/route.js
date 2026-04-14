import { NextResponse } from 'next/server';
import { runQuery, toNum } from '@/lib/neo4j';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const token = cookies().get('token')?.value;
    const userData = await verifyToken(token);

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    // Case-insensitive partial match across all games
    const gameRecords = await runQuery(
      'MATCH (g:Game) WHERE toLower(g.name) CONTAINS toLower($name) RETURN g',
      { name: name.trim() }
    );

    if (gameRecords.length === 0) {
      return NextResponse.json({ error: 'No games found matching that name.' }, { status: 404 });
    }

    const games = gameRecords.map(record => {
      const g = record.get('g').properties;

      const gameCpu = toNum(g.cpuRanking);
      const gameGpu = toNum(g.gpuRanking);
      const gameRam = toNum(g.minRam);

      // Compatibility logic (mirrors original Python):
      // canRun if game's min rank > user's rank (user has a better/lower ranked component)
      // and game's minRam < user's ram
      const cpuOk = gameCpu > userData.cpuRanking;
      const gpuOk = gameGpu > userData.gpuRanking;
      const ramOk = gameRam < userData.ram;
      const canRun = cpuOk && gpuOk && ramOk;

      return {
        name: g.name,
        size: toNum(g.size),
        cpuRanking: gameCpu,
        gpuRanking: gameGpu,
        minRam: gameRam,
        link: g.link,
        canRun,
        compatibility: { cpuOk, gpuOk, ramOk },
      };
    });

    return NextResponse.json({ games });
  } catch (err) {
    console.error('Game search error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
