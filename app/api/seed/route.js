import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

const CPUS = [
  { name: 'Intel Core i9-13900K',  ranking: 1  },
  { name: 'AMD Ryzen 9 7950X',     ranking: 2  },
  { name: 'Intel Core i7-13700K',  ranking: 3  },
  { name: 'AMD Ryzen 7 7700X',     ranking: 4  },
  { name: 'Intel Core i5-13600K',  ranking: 5  },
  { name: 'AMD Ryzen 5 7600X',     ranking: 6  },
  { name: 'Intel Core i5-12400',   ranking: 7  },
  { name: 'AMD Ryzen 5 5600X',     ranking: 8  },
  { name: 'Intel Core i3-12100',   ranking: 9  },
  { name: 'AMD Ryzen 3 3300X',     ranking: 10 },
];

const GPUS = [
  { name: 'NVIDIA RTX 4090',       ranking: 1  },
  { name: 'NVIDIA RTX 4080',       ranking: 2  },
  { name: 'AMD RX 7900 XTX',       ranking: 3  },
  { name: 'NVIDIA RTX 4070 Ti',    ranking: 4  },
  { name: 'AMD RX 7800 XT',        ranking: 5  },
  { name: 'NVIDIA RTX 3080',       ranking: 6  },
  { name: 'AMD RX 6800 XT',        ranking: 7  },
  { name: 'NVIDIA RTX 3070',       ranking: 8  },
  { name: 'AMD RX 6700 XT',        ranking: 9  },
  { name: 'NVIDIA RTX 3060',       ranking: 10 },
  { name: 'AMD RX 6600',           ranking: 11 },
  { name: 'NVIDIA GTX 1660 Super', ranking: 12 },
  { name: 'AMD RX 580',            ranking: 13 },
  { name: 'NVIDIA GTX 1060',       ranking: 14 },
];

// cpuRanking / gpuRanking = the weakest rank that can still run this game.
// A user whose CPU rank <= game.cpuRanking can run it (their CPU is equal or better).
// Compatibility: game.cpuRanking > user.cpuRanking  (same logic as original Python)
const GAMES = [
  {
    name: 'Cyberpunk 2077',
    size: 70,   cpuRanking: 5,  gpuRanking: 6,  minRam: 16,
    link: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/',
  },
  {
    name: 'Elden Ring',
    size: 45,   cpuRanking: 6,  gpuRanking: 9,  minRam: 12,
    link: 'https://store.steampowered.com/app/1245620/ELDEN_RING/',
  },
  {
    name: 'Red Dead Redemption 2',
    size: 150,  cpuRanking: 6,  gpuRanking: 7,  minRam: 12,
    link: 'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/',
  },
  {
    name: 'GTA V',
    size: 95,   cpuRanking: 8,  gpuRanking: 11, minRam: 8,
    link: 'https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/',
  },
  {
    name: 'Minecraft',
    size: 1,    cpuRanking: 10, gpuRanking: 14, minRam: 4,
    link: 'https://www.minecraft.net/',
  },
  {
    name: 'Fortnite',
    size: 30,   cpuRanking: 8,  gpuRanking: 10, minRam: 8,
    link: 'https://www.fortnite.com/',
  },
  {
    name: 'Valorant',
    size: 20,   cpuRanking: 9,  gpuRanking: 12, minRam: 4,
    link: 'https://playvalorant.com/',
  },
  {
    name: 'CS2',
    size: 28,   cpuRanking: 8,  gpuRanking: 11, minRam: 8,
    link: 'https://store.steampowered.com/app/730/CounterStrike_2/',
  },
  {
    name: 'The Witcher 3',
    size: 50,   cpuRanking: 7,  gpuRanking: 9,  minRam: 8,
    link: 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/',
  },
  {
    name: 'Doom Eternal',
    size: 45,   cpuRanking: 7,  gpuRanking: 8,  minRam: 8,
    link: 'https://store.steampowered.com/app/782330/DOOM_Eternal/',
  },
  {
    name: 'Hogwarts Legacy',
    size: 75,   cpuRanking: 5,  gpuRanking: 6,  minRam: 12,
    link: 'https://store.steampowered.com/app/990080/Hogwarts_Legacy/',
  },
  {
    name: "Baldur's Gate 3",
    size: 150,  cpuRanking: 6,  gpuRanking: 8,  minRam: 8,
    link: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/",
  },
  {
    name: 'Starfield',
    size: 125,  cpuRanking: 5,  gpuRanking: 6,  minRam: 16,
    link: 'https://store.steampowered.com/app/1716740/Starfield/',
  },
  {
    name: 'League of Legends',
    size: 22,   cpuRanking: 9,  gpuRanking: 13, minRam: 4,
    link: 'https://www.leagueoflegends.com/',
  },
  {
    name: 'Apex Legends',
    size: 75,   cpuRanking: 8,  gpuRanking: 11, minRam: 8,
    link: 'https://www.ea.com/games/apex-legends',
  },
];

export async function GET() {
  try {
    // Seed CPUs
    for (const cpu of CPUS) {
      await runQuery(
        'MERGE (c:CPU {ranking: $ranking}) SET c.name = $name',
        { ranking: cpu.ranking, name: cpu.name }
      );
    }

    // Seed GPUs
    for (const gpu of GPUS) {
      await runQuery(
        'MERGE (g:GPU {ranking: $ranking}) SET g.name = $name',
        { ranking: gpu.ranking, name: gpu.name }
      );
    }

    // Seed Games
    for (const game of GAMES) {
      await runQuery(
        `MERGE (g:Game {name: $name})
         SET g.size       = $size,
             g.cpuRanking = $cpuRanking,
             g.gpuRanking = $gpuRanking,
             g.minRam     = $minRam,
             g.link       = $link`,
        {
          name: game.name,
          size: game.size,
          cpuRanking: game.cpuRanking,
          gpuRanking: game.gpuRanking,
          minRam: game.minRam,
          link: game.link,
        }
      );
    }

    return NextResponse.json({
      success: true,
      seeded: {
        cpus: CPUS.length,
        gpus: GPUS.length,
        games: GAMES.length,
      },
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
