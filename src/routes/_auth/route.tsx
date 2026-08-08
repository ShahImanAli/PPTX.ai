import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '#/lib/auth.functions'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) throw redirect({ to: '/' })
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  )
}