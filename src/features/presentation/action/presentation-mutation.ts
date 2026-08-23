import { createServerFn } from '@tanstack/react-start'
import {
  createPresentationInputSchema,
  presentationIdInputSchema,
  updatePresentationInputSchema,
} from '../types/schema'
import { authFnMiddleware } from '#/middlewares/auth.ts'
import { prisma } from '#/lib/db.ts'
import { generateSlug } from 'random-word-slugs'
import { PresentationStatus } from '#/generated/prisma/browser.ts'
import { generatePresentationSlides } from '#/integrations/inngest/generate.ts'

export const createPresentation = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => createPresentationInputSchema.parse(data))
  .middleware([authFnMiddleware])
  .handler(async ({ data, context }) => {
    const userId = context?.session?.user?.id

    const presentation = await prisma.presentation.create({
      data: {
        userId,
        title: generateSlug(),
        prompt: data.prompt,
        slideCount: data.slideCount,
        style: data.style,
        tone: data.tone,
        layout: data.layout,
        status: PresentationStatus.GENERATING,
      },
    })

    // Fire-and-forget generation so the request returns quickly.
    // The UI polls the presentation status while it's GENERATING.
    generatePresentationSlides(presentation.id).catch((error) => {
      console.error('Failed to generate presentation:', error)
      prisma.presentation
        .update({
          where: { id: presentation.id },
          data: { status: PresentationStatus.FAILED },
        })
        .catch(() => {})
    })

    return presentation
  })

export const updatePresentation = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => updatePresentationInputSchema.parse(data))
  .middleware([authFnMiddleware])
  .handler(async ({ data, context }) => {
    const userId = context?.session?.user?.id

    const { id, ...patch } = data

    const existing = await prisma.presentation.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existing) {
      throw new Error('Presentation not found')
    }

    const updatedData = patch

    return prisma.presentation.update({
      where: {
        id,
      },
      data: updatedData,
    })
  })

export const deletePresentation = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => presentationIdInputSchema.parse(data))
  .middleware([authFnMiddleware])
  .handler(async ({ data, context }) => {
    const userId = context?.session?.user?.id

    const existing = await prisma.presentation.findFirst({
      where: {
        id: data?.id,
        userId,
      },
    })

    if (!existing) {
      throw new Error('Presentation not found')
    }

    const presentation = await prisma.presentation.delete({
      where: {
        id: data.id,
      },
    })
    return presentation
  })

export const regeneratePresentation = createServerFn({ method: 'POST' })
  .validator((data: unknown) => presentationIdInputSchema.parse(data))
  .middleware([authFnMiddleware])
  .handler(async ({ data, context }) => {
    const userId = context?.session?.user?.id

    const existing = await prisma.presentation.findFirst({
      where: { id: data.id, userId },
    })
    if (!existing) throw new Error('Not found')

    await prisma.presentation.update({
      where: { id: data.id },
      data: { status: PresentationStatus.GENERATING },
    })

    // Fire-and-forget generation so the request returns quickly.
    // The UI polls the presentation status while it's GENERATING.
    generatePresentationSlides(data.id).catch((error) => {
      console.error('Failed to regenerate presentation:', error)
      prisma.presentation
        .update({
          where: { id: data.id },
          data: { status: PresentationStatus.FAILED },
        })
        .catch(() => {})
    })

    return { ok: true as const }
  })