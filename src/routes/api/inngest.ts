import { inngest } from '#/integrations/inngest/client.ts'
import { createFileRoute } from '@tanstack/react-router'
import { serve } from 'inngest/edge'
import { generatePresentation } from '#/integrations/inngest/function.ts'

const handler = serve({
  client: inngest,
  functions: [generatePresentation],
})

export const Route = createFileRoute('/api/inngest')({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
      PUT: async ({ request }) => handler(request),
    },
  },
})
