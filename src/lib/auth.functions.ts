import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const getSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { auth } = await import('./auth')
  const headers = getRequestHeaders()
  const response = await auth.api.getSession({ headers })
  return response
})

export const ensureSession = () =>
  createServerFn({
    method: 'GET',
  }).handler(async () => {
    const { auth } = await import('./auth')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) {
      throw new Error('Unauthorized')
    }
    return session
  })
