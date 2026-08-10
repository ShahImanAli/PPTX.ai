import PptxGenJS from 'pptxgenjs'

type ExportSlide = {
  id: string
  order: number
  title: string
  content: string
  notes?: string | null
  imageUrl?: string | null
}

type ExportToPptxOptions = {
  title: string
  slides: ExportSlide[]
}

const SLIDE_WIDTH = 13.333 // 16:9 widescreen
const SLIDE_HEIGHT = 7.5

const COLORS = {
  primary: '1E293B', // slate-800
  overlay: '000000',
  white: 'FFFFFF',
}

function sanitizeFilename(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || 'presentation'
}

export async function exportToPptx({
  title,
  slides,
}: ExportToPptxOptions): Promise<string> {
  if (slides.length === 0) {
    throw new Error('No slides to export')
  }

  const pptx = new PptxGenJS()
  pptx.defineLayout({
    name: 'WIDE',
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
  })
  pptx.layout = 'WIDE'
  pptx.author = 'PPTX.ai'
  pptx.company = 'PPTX.ai'
  pptx.subject = title
  pptx.title = title

  // ── Content slides ───────────────────────────────────────────
  // Each slide: full-bleed background image + dark overlay + large
  // white title & content text on top.
  for (const slide of slides) {
    const contentSlide = pptx.addSlide()
    contentSlide.background = { color: COLORS.primary }

    // Full-bleed background image (object-cover, like the preview)
    if (slide.imageUrl) {
      contentSlide.addImage({
        path: slide.imageUrl,
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        sizing: {
          type: 'cover',
          w: SLIDE_WIDTH,
          h: SLIDE_HEIGHT,
        },
      })
    }

    // Dark overlay — semi-transparent so the image shows through
    // while keeping the white text readable
    contentSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: SLIDE_WIDTH,
      h: SLIDE_HEIGHT,
      fill: {
        type: 'solid',
        color: COLORS.overlay,
        transparency: 55,
      },
    })

    // Title — large, bold, white
    contentSlide.addText(slide.title, {
      x: 0.9,
      y: 0.8,
      w: SLIDE_WIDTH - 1.8,
      h: 2.0,
      fontSize: 40,
      bold: true,
      color: COLORS.white,
      valign: 'middle',
      fontFace: 'Arial',
    })

    // Content — large text, rendered exactly as written with line breaks
    contentSlide.addText(slide.content, {
      x: 0.9,
      y: 2.9,
      w: SLIDE_WIDTH - 1.8,
      h: 3.9,
      fontSize: 26,
      color: COLORS.white,
      valign: 'top',
      fontFace: 'Arial',
      lineSpacingMultiple: 1.3,
    })

    // Speaker notes
    if (slide.notes) {
      contentSlide.addNotes(slide.notes)
    }
  }

  const filename = `${sanitizeFilename(title)}.pptx`
  await pptx.writeFile({ fileName: filename })
  return filename
}