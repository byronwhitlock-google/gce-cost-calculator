export const clientID = process.env.NEXT_PUBLIC_CLIENT_ID
export const apiURL = process.env.NEXT_PUBLIC_API_URL
export const apiKey = process.env.NEXT_PUBLIC_API_KEY


const dev = process.env.NODE_ENV !== 'production'
export const server = dev ? 'http://localhost:3000' : 'https://sitedomain.com'