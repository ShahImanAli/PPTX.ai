import { useState } from 'react'
import {
  SLIDE_BASE_HEIGHT,
  SLIDE_BASE_WIDTH,
  SlideStage,
} from './slide-stage'

type SlideData = {
  id: string
  order: number
  title: string
  content: string
  notes?: string | null
  imageUrl?: string | null
}

type SlidePreviewProps = {
  slide: SlideData
  isFullscreen?: boolean
}

/**
 * Canonical slide rendering shared by the inline preview and the
 * fullscreen/slideshow stages. Rendered on a fixed 1280x720 canvas so every
 * formatting detail (font, size, color, spacing, alignment, position) is
 * identical in all modes.
 */
export function SlideSurface({ slide }: { slide: SlideData }) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl bg-linear-to-br from-background to-muted"
      style={{
        width: `${SLIDE_BASE_WIDTH}px`,
        height: `${SLIDE_BASE_HEIGHT}px`,
      }}
    >
      {slide.imageUrl && (
        <img
          src={slide.imageUrl}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(false)}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/50 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-center p-12">
        <h2 className="font-bold mb-6 drop-shadow-lg text-6xl text-foreground">
          {slide.title}
        </h2>
        <div className="whitespace-pre-line drop-shadow-md text-2xl text-foreground max-w-2xl">
          {slide.content}
        </div>
      </div>
    </div>
  )
}

export function SlidePreview({ slide, isFullscreen }: SlidePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  if (isFullscreen) {
    return (
      <SlideStage className="w-full h-full">
        <SlideSurface slide={slide} />
      </SlideStage>
    )
  }

  return (
    <div className="overflow-hidden glass rounded-2xl">
      <div className="relative aspect-video bg-linear-to-br from-background to-muted">
        {slide.imageUrl && (
          <img
            src={slide.imageUrl}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/50 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12">
          <h2 className="font-bold mb-4 drop-shadow-lg text-3xl md:text-5xl text-foreground">
            {slide.title}
          </h2>
          <div className="whitespace-pre-line drop-shadow-md text-lg md:text-xl text-foreground max-w-2xl">
            {slide.content}
          </div>
        </div>
      </div>
      {slide.notes && (
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Speaker notes:</span> {slide.notes}
          </p>
        </div>
      )}
    </div>
  )
}
