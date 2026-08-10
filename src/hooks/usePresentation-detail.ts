import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  LAYOUT_OPTIONS,
  SLIDE_STYLES,
  TONE_OPTIONS,
  type SlideLayout,
  type SlideStyle,
  type SlideTone,
} from '#/features/presentation/constant/presentation-options'
import { presentationQueryKeys } from '#/features/presentation/hooks/query-keys'
import { getPresentationWithSlides } from '#/features/presentation/action/presentation-query'
import {
  deletePresentation,
  regeneratePresentation,
  updatePresentation,
} from '#/features/presentation/action/presentation-mutation'

type SettingsForm = {
  title: string
  prompt: string
  slideCount: number
  style: SlideStyle
  tone: SlideTone
  layout: SlideLayout
}

const isSlideStyle = (value: string): value is SlideStyle =>
  SLIDE_STYLES.some((option) => option.value === value)

const isSlideTone = (value: string): value is SlideTone =>
  TONE_OPTIONS.some((option) => option.value === value)

const isSlideLayout = (value: string): value is SlideLayout =>
  LAYOUT_OPTIONS.some((option) => option.value === value)

export function usePresentationDetail(
  presentationId: string,
  opts?: {
    onDeleted?: () => void
  },
) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: presentationQueryKeys.detail(presentationId),
    queryFn: () => getPresentationWithSlides({ data: { id: presentationId } }),
    refetchInterval: (q) =>
      q.state.data?.status === 'GENERATING' ? 3000 : false,
  })

  const [form, setForm] = useState<SettingsForm>({
    title: '',
    prompt: '',
    slideCount: 8,
    style: 'minimal',
    tone: 'formal',
    layout: 'balanced',
  })

  useEffect(() => {
    if (!query.data) return
    setForm({
      title: query.data.title,
      prompt: query.data.prompt,
      slideCount: query.data.slideCount,
      style: isSlideStyle(query.data.style) ? query.data.style : 'minimal',
      tone: isSlideTone(query.data.tone) ? query.data.tone : 'formal',
      layout: isSlideLayout(query.data.layout) ? query.data.layout : 'balanced',
    })
  }, [query.data])

  const updateMut = useMutation({
    mutationFn: () =>
      updatePresentation({
        data: {
          id: presentationId,
          title: form.title,
          prompt: form.prompt,
          slideCount: form.slideCount,
          style: form.style,
          tone: form.tone,
          layout: form.layout,
        },
      }),
    onSuccess: () => {
      toast.success('Presentation saved')
      queryClient.invalidateQueries({ queryKey: presentationQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: presentationQueryKeys.detail(presentationId),
      })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Could not save')
    },
  })

  const regenerateMut = useMutation({
    mutationFn: () => regeneratePresentation({ data: { id: presentationId } }),
    onSuccess: () => {
      toast.success('Regenerating slides…')
      queryClient.invalidateQueries({
        queryKey: presentationQueryKeys.detail(presentationId),
      })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Could not regenerate')
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deletePresentation({ data: { id: presentationId } }),
    onSuccess: () => {
      toast.success('Presentation deleted')
      queryClient.invalidateQueries({ queryKey: presentationQueryKeys.list() })
      queryClient.removeQueries({
        queryKey: presentationQueryKeys.detail(presentationId),
      })
      opts?.onDeleted?.()
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Could not delete')
    },
  })

  const slides = query.data?.slides ?? []
  const isGenerating = query.data?.status === 'GENERATING'

  const updatedLabel = useMemo(() => {
    if (!query.data?.updatedAt) return ''
    return new Date(query.data.updatedAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }, [query.data?.updatedAt])

  return {
    query,
    slides,
    isGenerating, 
    updatedLabel,
    form,
    setForm,
    updateMut,
    regenerateMut,
    deleteMut,
  }
}
