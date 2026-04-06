'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DebugPage() {
    const [status, setStatus] = useState<string>('')
    const [error, setError] = useState<string>('')
    const [result, setResult] = useState<any>(null)

    const testConnection = async () => {
        setStatus('Testing connection...')
        setError('')
        try {
            const { data, error: err } = await supabase.auth.getSession()
            if (err) throw err
            setStatus('Connection OK')
            setResult(data)
        } catch (err: any) {
            setError(err.message)
            setStatus('Connection failed')
        }
    }

    const testSignUp = async () => {
        setStatus('Testing sign up...')
        setError('')
        setResult(null)
        try {
            console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
            console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

            const { data, error: err } = await supabase.auth.signUp({
                email: 'test@test.com',
                password: 'Test123!@',
                options: {
                    data: {
                        full_name: 'Test User',
                        role: 'candidate',
                    },
                },
            })

            if (err) {
                console.error('Sign up error:', err)
                throw err
            }

            setStatus('Sign up successful')
            setResult(data)
        } catch (err: any) {
            console.error('Full error:', err)
            setError(err.message || JSON.stringify(err))
            setStatus('Sign up failed')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-6">Supabase Debug</h1>

                <div className="space-y-4">
                    <button
                        onClick={testConnection}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        Test Connection
                    </button>

                    <button
                        onClick={testSignUp}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                        Test Sign Up
                    </button>

                    {status && (
                        <div className={`p-3 rounded ${status.includes('failed') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            <p className="font-semibold">{status}</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded bg-red-100 text-red-800">
                            <p className="font-semibold">Error:</p>
                            <p className="text-sm mt-1 break-words">{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="p-3 rounded bg-green-100 text-green-800">
                            <p className="font-semibold">Result:</p>
                            <pre className="text-xs mt-1 overflow-auto bg-white text-gray-800 p-2 rounded max-h-96">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}

                    <div className="p-3 rounded bg-gray-100 text-sm">
                        <p className="font-semibold mb-2">Environment:</p>
                        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
