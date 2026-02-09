/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Static export so Vercel can deploy from a monorepo even if the project is configured
    // as a "Static" framework with an explicit output directory.
    output: 'export',
    trailingSlash: true,
    compiler: {
        styledComponents: true,
    },
    images: {
        domains: ['localhost', 'wholexale.com'],
        // next/image optimization requires a server; disable for static export.
        unoptimized: true,
    },
}

export default nextConfig
