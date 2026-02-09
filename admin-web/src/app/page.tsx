"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
    const router = useRouter()

    useEffect(() => {
        router.push('/admin/login')
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Redirecting to admin login...</p>
            </div>
        </div>
    )
}