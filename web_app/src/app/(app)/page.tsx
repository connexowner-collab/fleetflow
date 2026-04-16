import { redirect } from 'next/navigation'

// /app → redireciona para /app/home (ou /app/login se não autenticado)
export default function AppRoot() {
  redirect('/app/home')
}
