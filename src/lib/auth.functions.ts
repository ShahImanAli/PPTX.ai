import { createServerFn } from '@tanstack/react-start'

import { getAuthSession } from './auth.server'

export const getSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  return getAuthSession()
})

export const ensureSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  const session = await getAuthSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
})
