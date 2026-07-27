import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

function getSessionClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ ok: true })
  const supabase = getSessionClient(request, response)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('name, email, notification_prefs')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const successResponse = NextResponse.json({
    name: data?.name ?? user.user_metadata?.name ?? '',
    email: data?.email ?? user.email ?? '',
    notification_prefs: data?.notification_prefs ?? {},
  })
  response.cookies.getAll().forEach((cookie) => successResponse.cookies.set(cookie.name, cookie.value))
  return successResponse
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, notification_prefs } = body

    const response = NextResponse.json({ ok: true })
    const supabase = getSessionClient(request, response)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const authUpdates: { data?: Record<string, unknown>; email?: string; password?: string } = {}
    if (name) authUpdates.data = { ...user.user_metadata, name }
    if (email && email !== user.email) authUpdates.email = email
    if (password) authUpdates.password = password

    if (Object.keys(authUpdates).length > 0) {
      const { error } = await supabase.auth.updateUser(authUpdates)
      if (error) throw error
    }

    const usersTableUpdate: Record<string, unknown> = {}
    if (name) usersTableUpdate.name = name
    if (email) usersTableUpdate.email = email
    if (notification_prefs) usersTableUpdate.notification_prefs = notification_prefs

    if (Object.keys(usersTableUpdate).length > 0) {
      const { error } = await supabase.from('users').update(usersTableUpdate).eq('id', user.id)
      if (error) throw error
    }

    const successResponse = NextResponse.json({ success: true })
    response.cookies.getAll().forEach((cookie) => successResponse.cookies.set(cookie.name, cookie.value))
    return successResponse
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
