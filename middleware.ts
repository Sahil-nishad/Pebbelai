import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/coach/:path*',
    '/reminders/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/admin',
  ],
}
