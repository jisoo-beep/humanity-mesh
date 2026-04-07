import crypto from 'crypto'

function getSecret(): string {
  return process.env.AUTH_SECRET ?? 'dev-secret-change-me'
}

export function generateToken(email: string, password: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`${email}:${password}`)
    .digest('hex')
}

export function verifyToken(token: string): boolean {
  const email = process.env.ADMIN_EMAIL ?? ''
  const password = process.env.ADMIN_PASSWORD ?? ''
  const expected = generateToken(email, password)

  if (token.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

export function isAuthenticated(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return false
  return verifyToken(auth.slice(7))
}
