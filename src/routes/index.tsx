import { useState } from 'react';
import { Button } from '#/components/ui/button';
import { Label } from '#/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '#/components/ui/select';
import { Slider } from '#/components/ui/slider';
import { Textarea } from '#/components/ui/textarea';
import {
    LAYOUT_OPTIONS,
    SLIDE_STYLES,
    TONE_OPTIONS,
} from '#/features/presentation/constant/presentation-options';
import {
    PRESENTATION_TEMPLATES,
} from '#/features/presentation/constant/presentation-templates';
import { getSession } from '#/lib/auth.functions';
import { createFileRoute, redirect } from '@tanstack/react-router';
import {
    AlignLeft,
    LayoutTemplate,
    MessageSquareText,
    Mic2,
    Presentation,
    Type,
    Wand2,
} from 'lucide-react';

type HomeFormState = {
    content: string;
    slideCount: number;
    style: (typeof SLIDE_STYLES)[number]['value'];
    tone: (typeof TONE_OPTIONS)[number]['value'];
    layout: (typeof LAYOUT_OPTIONS)[number]['value'];
};

export const Route = createFileRoute('/')({
    beforeLoad: async ({ location }) => {
        const session = await getSession();
        if (!session) {
            throw redirect({
                to: '/login',
                search: { redirect: location.href },
            });
        }
        return { user: session.user };
    },
    component: Home,
});

function Home() {
    const [form, setForm] = useState<HomeFormState>({
        content: '',
        slideCount: 8,
        style: 'minimal',
        tone: 'formal',
        layout: 'balanced',
    });

    const charCount = form.content.length;
    const maxChars = 5000;
    const charPercent = Math.min((charCount / maxChars) * 100, 100);

    return (
        <main className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                        What do you want to{' '}
                        <span className="text-gradient-peach">create?</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Enter your content and we'll generate a beautiful
                        presentation in seconds
                    </p>
                </div>

                {/* Main input card */}
                <div className="glass rounded-3xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/5 border-border/40">
                    {/* Textarea */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <Label
                                htmlFor="presentation-content"
                                className="text-sm font-medium flex items-center gap-2"
                            >
                                <MessageSquareText className="size-4 text-primary" />
                                Your Content
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                Markdown supported
                            </span>
                        </div>
                        <Textarea
                            id="presentation-content"
                            placeholder="Describe your presentation topic, paste your notes, or outline your key points..."
                            value={form.content}
                            onChange={(e) =>
                                setForm((s: HomeFormState) => ({
                                    ...s,
                                    content: e.target.value,
                                }))
                            }
                            className="h-50 min-h-50 max-h-50 overflow-y-auto text-base bg-background/50 border-border/50 rounded-2xl resize-none focus-visible:ring-primary/30"
                        />
                        <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                            <span>{charCount.toLocaleString()} characters</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary/60 rounded-full transition-all"
                                        style={{ width: `${charPercent}%` }}
                                    />
                                </div>
                                <span className="tabular-nums">
                                    {charCount}/{maxChars.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Options grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                        {/* Slide count */}
                        <div className="space-y-2.5 rounded-2xl border border-border/40 bg-background/30 p-4">
                            <Label className="text-sm font-medium flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Presentation className="size-4 text-primary" />
                                    Slides
                                </span>
                                <span className="text-primary font-semibold tabular-nums">
                                    {form.slideCount}
                                </span>
                            </Label>
                            <Slider
                                value={[form.slideCount]}
                                onValueChange={(value) => {
                                    const v = Array.isArray(value)
                                        ? value[0]
                                        : value;
                                    setForm((s: HomeFormState) => ({
                                        ...s,
                                        slideCount: v,
                                    }));
                                }}
                                min={3}
                                max={20}
                                step={1}
                                className="py-2"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                                <span>3</span>
                                <span>20</span>
                            </div>
                        </div>

                        {/* Style */}
                        <div className="space-y-2.5 rounded-2xl border border-border/40 bg-background/30 p-4">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Type className="size-4 text-primary" />
                                Style
                            </Label>
                            <Select
                                value={form.style}
                                onValueChange={(value) =>
                                    setForm((s: HomeFormState) => ({
                                        ...s,
                                        style: value as HomeFormState['style'],
                                    }))
                                }
                            >
                                <SelectTrigger className="bg-background/50 border-border/50 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                    {SLIDE_STYLES.map((s) => (
                                        <SelectItem
                                            key={s.value}
                                            value={s.value}
                                        >
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tone */}
                        <div className="space-y-2.5 rounded-2xl border border-border/40 bg-background/30 p-4">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Mic2 className="size-4 text-primary" />
                                Tone
                            </Label>
                            <Select
                                value={form.tone}
                                onValueChange={(value) =>
                                    setForm((s: HomeFormState) => ({
                                        ...s,
                                        tone: value as HomeFormState['tone'],
                                    }))
                                }
                            >
                                <SelectTrigger className="bg-background/50 border-border/50 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                    {TONE_OPTIONS.map((t) => (
                                        <SelectItem
                                            key={t.value}
                                            value={t.value}
                                        >
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Layout */}
                        <div className="space-y-2.5 rounded-2xl border border-border/40 bg-background/30 p-4">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <LayoutTemplate className="size-4 text-primary" />
                                Layout
                            </Label>
                            <Select
                                value={form.layout}
                                onValueChange={(value) =>
                                    setForm((s: HomeFormState) => ({
                                        ...s,
                                        layout: value as HomeFormState['layout'],
                                    }))
                                }
                            >
                                <SelectTrigger className="bg-background/50 border-border/50 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                    {LAYOUT_OPTIONS.map((l) => (
                                        <SelectItem
                                            key={l.value}
                                            value={l.value}
                                        >
                                            {l.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Generate button */}
                    <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-2">
                        <p className="text-xs text-muted-foreground sm:mr-auto flex items-center gap-1.5">
                            <AlignLeft className="size-3.5" />
                            {form.content.trim()
                                ? 'Ready to generate your presentation'
                                : 'Add some content to get started'}
                        </p>
                        <Button
                            size="lg"
                            disabled={!form.content.trim()}
                            className="rounded-xl px-8 gap-2 font-semibold bg-linear-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60 shadow-lg shadow-primary/20 transition-all"
                        >
                            <Wand2 className="size-5" />
                            Generate PPT
                        </Button>
                    </div>
                </div>

                {/* Footer hint */}
                {/* <p className="text-center text-xs text-muted-foreground/70 mt-6">
                    Your content is processed securely. You can edit every slide
                    after generation.
                </p> */}

                 <div className="mt-8">
          <p className="text-center text-sm text-muted-foreground mb-3">
            Try a template
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESENTATION_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setForm({
                    content: template.content,
                    slideCount: template.slides,
                    style: template.style,
                    tone: template.tone,
                    layout: template.layout,
                  })
                }}
                className="px-4 py-2 text-sm rounded-full border border-border/50 bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                {template.label}
              </button>
            ))}
          </div>
            </div>
            </div>
        </main>
    );
}
