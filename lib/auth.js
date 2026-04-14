import { SignJWT, jwtVerify } from 'jose';

function getSecret() {
  const key = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';
  return new TextEncoder().encode(key);
}

export async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token) {
  if (!token) throw new Error('No token');
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}
