export const clientID = process.env.NEXT_PUBLIC_CLIENT_ID

console.log("asdasd " + clientID)

const dev = process.env.NODE_ENV !== 'production'
export const server = dev ? 'http://localhost:3000' : 'https://sitedomain.com'