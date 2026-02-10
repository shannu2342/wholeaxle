import type { Metadata } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-body',
})

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-display',
})

export const metadata: Metadata = {
    title: 'Wholexale Admin Dashboard',
    description: 'Admin dashboard for Wholexale B2B Marketplace',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${manrope.variable} ${spaceGrotesk.variable} font-body`}>{children}</body>
        </html>
    )
}
