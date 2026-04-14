import neo4j from 'neo4j-driver';

let driver;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
      { logging: neo4j.logging.console('warn') }
    );
  }
  return driver;
}

export async function runQuery(cypher, params = {}) {
  const d = getDriver();
  const session = d.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Helper to safely convert Neo4j integers to JS numbers
export function toNum(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val.toNumber) return val.toNumber();
  if (typeof val === 'object' && 'low' in val) return val.low; // Neo4j integer fallback
  return Number(val);
}
