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

export const createPresentation = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => createPresentationInputSchema.parse(data))
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
        status: PresentationStatus.COMPLETED,
      },
      //TODO:Inngest bg job trigger
    })
    return presentation
  })

export const updatePresentation = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => updatePresentationInputSchema.parse(data))
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
  .inputValidator((data: unknown) => presentationIdInputSchema.parse(data))
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
  .inputValidator((data: unknown) => presentationIdInputSchema.parse(data))
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

    // await inngest.send({
    //   name: 'presentation/generate',
    //   data: { presentationId: data.id },
    // })

    return { ok: true as const }
  })
