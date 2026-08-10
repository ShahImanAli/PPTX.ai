import { useState } from 'react'

type SlidePreviewProps = {
  slide: {
    id: string
    order: number
    title: string
    content: string
    notes?: string | null
    imageUrl?: string | null
  }
  isFullscreen?: boolean
}

export function SlidePreview({ slide, isFullscreen }: SlidePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div
      className={`overflow-hidden ${
        isFullscreen ? 'w-full h-full bg-black' : 'glass rounded-2xl'
      }`}
    >
      <div
        className={`relative bg-linear-to-br from-background to-muted ${
          isFullscreen ? 'w-full h-full' : 'aspect-video'
        }`}
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
        {!isFullscreen && (
          <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/50 to-transparent" />
        )}
        {isFullscreen && (
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
        )}
        <div
          className={`relative z-10 h-full flex flex-col justify-center ${
            isFullscreen
              ? 'p-12 md:p-20 lg:p-28 items-start text-left'
              : 'p-8 md:p-12'
          }`}
        >
          <h2
            className={`font-bold mb-4 drop-shadow-lg ${
              isFullscreen
                ? 'text-4xl md:text-6xl lg:text-7xl text-white max-w-3xl'
                : 'text-2xl md:text-4xl text-foreground'
            }`}
          >
            {slide.title}
          </h2>
          <div
            className={`whitespace-pre-line drop-shadow-md ${
              isFullscreen
                ? 'text-xl md:text-2xl lg:text-3xl text-white max-w-2xl'
                : 'text-base md:text-lg text-foreground max-w-xl'
            }`}
          >
            {slide.content}
          </div>
        </div>
      </div>
      {slide.notes && !isFullscreen && (
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Speaker notes:</span> {slide.notes}
          </p>
        </div>
      )}
    </div>
  )
}
