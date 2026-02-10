/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0B5ED7',
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#64748B',
                    foreground: '#ffffff',
                },
                destructive: {
                    DEFAULT: '#EF4444',
                    foreground: '#ffffff',
                },
                success: {
                    DEFAULT: '#10B981',
                    foreground: '#ffffff',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    foreground: '#ffffff',
                },
                background: '#ffffff',
                foreground: '#1F2937',
                muted: {
                    DEFAULT: '#F3F4F6',
                    foreground: '#6B7280',
                },
                border: '#E5E7EB',
                input: '#E5E7EB',
                ring: '#0B5ED7',
            },
            fontFamily: {
                body: ['Manrope', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
