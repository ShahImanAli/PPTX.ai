import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'

import { deletePresentation } from '../action/presentation-mutation'
import { presentationQueryKeys } from '../hooks/query-keys'
import type { PresentationListItem } from '../types/presentation.types'
import { presentationThumbnailUrl } from '../utils/thumbnail-url'

type PresentationCardProps = {
  presentation: PresentationListItem
}

export function PresentationCard({ presentation: p }: PresentationCardProps) {
  const queryClient = useQueryClient()

  const updated = new Date(p.updatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const thumb = p.slides[0]?.imageUrl ?? presentationThumbnailUrl(p.id)

  const deleteMut = useMutation({
    mutationFn: () => deletePresentation({ data: { id: p.id } }),
    onSuccess: () => {
      toast.success('Presentation deleted')
      queryClient.invalidateQueries({
        queryKey: presentationQueryKeys.list(),
      })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Could not delete')
    },
  })

  return (
    <Card className="relative group h-full glass border-border/50 py-0 overflow-hidden transition-colors hover:border-primary/40">
      <Link
        to="/presentation/$presentationId"
        params={{ presentationId: p.id }}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <div className="relative aspect-video overflow-hidden bg-background/30">
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
          {p.status === 'GENERATING' && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-primary-foreground backdrop-blur">
              <Loader2 className="size-3 animate-spin" />
              Generating…
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-white text-base line-clamp-2 drop-shadow">
              {p.title}
            </h3>
          </div>
        </div>
        <CardContent className="px-4 pt-3 pb-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            {p.slideCount} slides · {p.style} · {p.tone}
          </p>
          <p className="text-xs text-muted-foreground/80">
            Updated {updated}
          </p>
        </CardContent>
      </Link>

      <AlertDialog>
        <AlertDialogTrigger
          render={<span className="absolute top-2 right-2 z-10" />}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={`Delete ${p.title}`}
            className="size-8 rounded-lg bg-black/40 text-white border border-white/20 backdrop-blur hover:bg-destructive/90 hover:text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            disabled={deleteMut.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete presentation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              &quot;{p.title}&quot; and all its slides.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMut.mutate()}
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
