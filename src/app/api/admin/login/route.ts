import { generateToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const validEmail = process.env.ADMIN_EMAIL
    const validPassword = process.env.ADMIN_PASSWORD

    if (!validEmail || !validPassword) {
      return Response.json({ success: false, error: 'Server misconfiguration' }, { status: 500 })
    }

    if (email !== validEmail || password !== validPassword) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const token = generateToken(email, password)
    return Response.json({ success: true, token, user: { email, name: '관리자' } })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
