import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { email, password, action } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('=== Supabase Auth Debug ===')
    console.log('URL:', supabaseUrl)
    console.log('Key prefix:', supabaseAnonKey?.substring(0, 20))
    console.log('Action:', action)

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json({
            status: 'error',
            message: 'Missing Supabase credentials'
        }, { status: 400 })
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'implicit'
            }
        })

        if (action === 'signup') {
            console.log('Attempting signup with:', email)
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: 'Test User',
                        role: 'candidate',
                    },
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
                },
            })

            if (error) {
                console.error('Sign up error:', error)
                throw error
            }

            console.log('Sign up successful')
            return NextResponse.json({
                status: 'success',
                message: 'Sign up email sent. Check your inbox.',
                data
            })
        }

        if (action === 'signin') {
            console.log('Attempting signin with:', email)
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.error('Sign in error:', error)
                throw error
            }

            console.log('Sign in successful')
            return NextResponse.json({
                status: 'success',
                message: 'Signed in successfully',
                data
            })
        }

        return NextResponse.json({
            status: 'error',
            message: 'Invalid action'
        }, { status: 400 })

    } catch (error: any) {
        console.error('Auth error:', error)
        return NextResponse.json({
            status: 'error',
            message: error.message,
            error: {
                name: error.name,
                message: error.message,
                status: error.status
            }
        }, { status: 500 })
    }
}
