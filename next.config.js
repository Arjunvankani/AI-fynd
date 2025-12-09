/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MODEL_NAME: process.env.MODEL_NAME || 'gemini-pro',
  },
}

module.exports = nextConfig

