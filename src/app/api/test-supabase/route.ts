import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Testing Supabase Connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key exists:', !!supabaseAnonKey)

    if (!supabaseUrl || !supabaseAnonKey) {
        return Response.json({
            status: 'error',
            message: 'Missing Supabase credentials',
            url: supabaseUrl,
            keyExists: !!supabaseAnonKey
        }, { status: 400 })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Test connection by getting auth status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        // Test database connection
        const { data, error } = await supabase.from('users').select('count()', { count: 'exact', head: true })

        return Response.json({
            status: 'success',
            message: 'Supabase connection successful',
            supabaseUrl,
            session: !!session,
            database: {
                connected: !error,
                error: error?.message
            }
        })
    } catch (error: any) {
        console.error('Supabase connection error:', error)
        return Response.json({
            status: 'error',
            message: error.message,
            error: error.toString()
        }, { status: 500 })
    }
}
