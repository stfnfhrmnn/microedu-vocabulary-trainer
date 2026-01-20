const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages deploys to /<repo-name>/ subpath
  basePath: isGitHubPages ? '/microedu-vocabulary-trainer' : '',
  assetPrefix: isGitHubPages ? '/microedu-vocabulary-trainer/' : '',
}

module.exports = withSerwist(nextConfig)
