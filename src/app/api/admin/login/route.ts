export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const validEmail = process.env.ADMIN_EMAIL || 'admin@test.com'
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (email === validEmail && password === validPassword) {
      return Response.json({
        success: true,
        token: 'mock-admin-token-2026',
        user: { email: validEmail, name: '관리자' },
      })
    }

    return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
