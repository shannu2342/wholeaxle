/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compiler: {
        styledComponents: true,
    },
    images: {
        domains: ['localhost', 'wholexale.com'],
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/admin/login',
                permanent: true,
            },
        ]
    },
}

export default nextConfig
