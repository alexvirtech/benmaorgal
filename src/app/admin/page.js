import AdminPanel from './AdminPanel'

export const metadata = {
  title: 'Admin — BenMaorGal',
  robots: 'noindex, nofollow',
}

export default function AdminPage() {
  return <AdminPanel clientId={process.env.GOOGLE_CLIENT_ID || ''} />
}
