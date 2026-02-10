/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0390F3',
                    dark: '#027BC9',
                    light: '#E5F4FF',
                },
                secondary: {
                    DEFAULT: '#10B981',
                    dark: '#059669',
                    light: '#D1FAE5',
                },
                danger: {
                    DEFAULT: '#EF4444',
                    dark: '#DC2626',
                    light: '#FEE2E2',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    dark: '#D97706',
                    light: '#FEF3C7',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    dark: '#2563EB',
                    light: '#DBEAFE',
                },
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
}