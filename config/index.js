export const clientID = process.env.CLIENT_ID

const dev = process.env.NODE_ENV !== 'production'
export const server = dev ? 'http://localhost:3000' : 'https://sitedomain.com'