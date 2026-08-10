import { inngest } from './client'
import { generatePresentationSlides } from './generate'

export const generatePresentation = inngest.createFunction(
  {
    id: 'generate-presentation',
    retries: 2,
    triggers: [{ event: 'presentation/generate' }],
  },
  async ({ event, step }) => {
    const { presentationId } = event.data as { presentationId: string }

    return step.run('generate-presentation', async () => {
      return generatePresentationSlides(presentationId)
    })
  },
)