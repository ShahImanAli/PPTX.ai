import { prisma } from '#/lib/db.ts'
import { z } from 'zod'
import { generateAndStoreImage } from './image'

const slideSchema = z.object({
  title: z.string().describe('Slide title'),
  content: z.string().describe('Main content / bullet points for the slide'),
  notes: z.string().optional().describe('Speaker notes'),
  imagePrompt: z
    .string()
    .describe(
      'A detailed prompt to generate an illustration for this slide. Include: subject, style (flat vector illustration, 3D render, photo-realistic, minimal line art), color palette, composition (centered subject, clean background, generous negative space), lighting/mood. Explicitly: no text, no words, no letters, no watermark.',
    ),
})

const slidesResponseSchema = z.object({
  slides: z.array(slideSchema),
})

type SlidesResponse = z.infer<typeof slidesResponseSchema>['slides']

const JSON_SCHEMA_DESCRIPTION = `Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "slides": [
    {
      "title": "string - Slide title",
      "content": "string - Main content / bullet points for the slide",
      "notes": "string (optional) - Speaker notes",
      "imagePrompt": "string - A detailed prompt to generate an illustration for this slide. Include: subject, style (flat vector illustration, 3D render, photo-realistic, minimal line art), color palette, composition (centered subject, clean background, generous negative space), lighting/mood. Explicitly: no text, no words, no letters, no watermark."
    }
  ]
}`

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
- For imagePrompt, write a highly detailed prompt: subject + style + color palette + composition + lighting. Explicitly forbid text/words/letters/watermark in the image.

${JSON_SCHEMA_DESCRIPTION}`

  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('Invalid credentials!')
  }

  // Generate slides content with Groq Cloud
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: presentation.prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    throw new Error(
      `Text generation failed: ${res.status} ${await res.text()}`,
    )
  }

  const result = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }

  const rawText = result.choices?.[0]?.message?.content
  if (!rawText) {
    throw new Error(
      `Text generation failed: ${JSON.stringify(result.error ?? result)}`,
    )
  }

  // Parse the JSON response from the model
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`Text generation failed: ${rawText}`)
  }
  const slides: SlidesResponse = slidesResponseSchema.parse(
    JSON.parse(jsonMatch[0]),
  ).slides

  // delete old slides
  await prisma.slide.deleteMany({
    where: { presentationId },
  })

  // Global style descriptor injected into every image prompt for consistency
  const globalStyle = `Style: ${presentation.style}. Consistent visual identity across all slides.`

  // Generate + store each image SEQUENTIALLY (one at a time) with a small
  // delay between them. Parallel generation (Promise.all) hits the image
  // provider's per-minute rate limit (429), so only a few images succeed.
  // Image failures are non-fatal: the slide is saved without an image so the
  // deck still completes, and the frontend renders a clean gradient
  // background for slides without an imageUrl.
  const data: Array<{
    presentationId: string
    order: number
    title: string
    content: string
    notes: string | null
    imagePrompt: string | null
    imageUrl: string | null
  }> = []
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i]
    let imageUrl: string | null = null
    try {
      imageUrl = await generateAndStoreImage(
        `${globalStyle} ${s.imagePrompt}`,
        `slide-${presentationId}-${i}`,
      )
    } catch (error) {
      console.error(
        `Failed to generate image for slide ${i + 1} (${s.title}):`,
        error,
      )
    }
    data.push({
      presentationId,
      order: i,
      title: s.title,
      content: s.content,
      notes: s.notes ?? null,
      imagePrompt: s.imagePrompt,
      imageUrl,
    })
    // Small delay between image generations to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  await prisma.slide.createMany({ data })

  // set presentation as completed
  await prisma.presentation.update({
    where: { id: presentationId },
    data: { status: 'COMPLETED' },
  })

  return { success: true, slideCount: slides.length }
}