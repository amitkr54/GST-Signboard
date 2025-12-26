import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export async function signInWithGoogle() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    })
    if (error) console.error('Error signing in:', error)
}

export async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
}

export async function getUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}
