import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from './auth'

export async function getAuthSession() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session
}
