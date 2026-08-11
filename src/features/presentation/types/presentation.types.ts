import type { PresentationModel } from '#/generated/prisma/models/Presentation'

export type { PresentationModel as Presentation } from '#/generated/prisma/models/Presentation'

export type PresentationListItem = PresentationModel & {
  slides: { imageUrl: string | null }[]
}
