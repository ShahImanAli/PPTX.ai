import { prisma } from '#/lib/db.ts'
import { google } from '@ai-sdk/google'
import { Output, generateText } from 'ai'
import { z } from 'zod'

function buildImageKitUrl(prompt: string, filename: string): string {
  const baseUrl = process.env.IMAGEKIT_URL!
  const sanitizedPrompt = prompt
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)

  return `${baseUrl}/ik-genimg-prompt-${encodeURIComponent(sanitizedPrompt)}/${filename}.jpg?tr=w-1280,h-720`
}

const slideSchema = z.object({
  title: z.string().describe('Slide title'),
  content: z.string().describe('Main content / bullet points for the slide'),
  notes: z.string().optional().describe('Speaker notes'),
  imagePrompt: z
    .string()
    .describe(
      'A concise prompt to generate an illustration for this slide (professional, clean style, no text in image)',
    ),
})

const slidesResponseSchema = z.object({
  slides: z.array(slideSchema),
})

type SlidesResponse = z.infer<typeof slidesResponseSchema>['slides']

export async function generatePresentationSlides(presentationId: string) {
  // fetch the presentation
  const presentation = await prisma.presentation.findFirst({
    where: { id: presentationId },
  })
  if (!presentation) {
    throw new Error('Presentation not found')
  }

  // mark it as generating
  await prisma.presentation.update({
    where: { id: presentation.id },
    data: { status: 'GENERATING' },
  })

  // generate slides content
  const systemPrompt = `You are an expert presentation designer. Given a user's content/prompt, create a compelling presentation.

Style: ${presentation.style}
Tone: ${presentation.tone}
Layout preference: ${presentation.layout}
Number of slides requested: ${presentation.slideCount}

Guidelines:
- Create exactly ${presentation.slideCount} slides
- First slide should be a title slide
- Last slide should be a summary or call-to-action
- Keep content concise and impactful
- For imagePrompt, describe a professional illustration that complements the slide (no text in images)
`
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    output: Output.object({ schema: slidesResponseSchema }),
    system: systemPrompt,
    prompt: presentation.prompt,
  })

  const slides: SlidesResponse = slidesResponseSchema.parse(result.output).slides

  // delete old slides
  await prisma.slide.deleteMany({
    where: { presentationId },
  })

  // save slides in db
  const data = slides.map((s, i) => ({
    presentationId,
    order: i,
    title: s.title,
    content: s.content,
    notes: s.notes ?? null,
    imagePrompt: s.imagePrompt,
    imageUrl: buildImageKitUrl(
      s.imagePrompt,
      `slide-${presentationId}-${i}`,
    ),
  }))

  await prisma.slide.createMany({ data })

  // set presentation as completed
  await prisma.presentation.update({
    where: { id: presentationId },
    data: { status: 'COMPLETED' },
  })

  return { success: true, slideCount: slides.length }
}