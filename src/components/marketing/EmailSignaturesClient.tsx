'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import HeaderHero from '@/components/journey/HeaderHero';
import { Button } from '@/components/ui/Button';
import {
  buildEmailSignatureOption1Html,
  buildEmailSignatureOption2Html,
} from '@/lib/helpers/emailSignatureHtml';
import { cn } from '@/lib/utils';
import type { MarketingDictionary } from '@/lib/types/dictionary';

export interface EmailSignaturesClientProps {
  copy: MarketingDictionary['emailSignatures'];
  copyBaseUrl: string;
  previewOrigin: string;
}

function stripTagsForPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function copyHtmlToClipboard(html: string): Promise<void> {
  const plain = stripTagsForPlainText(html);
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
      return;
    }
  } catch {
    // Fallback below
  }
  await navigator.clipboard.writeText(html);
}

export function EmailSignaturesClient({
  copy,
  copyBaseUrl,
  previewOrigin,
}: EmailSignaturesClientProps) {
  const [busyOption, setBusyOption] = useState<1 | 2 | null>(null);

  const preview1 = buildEmailSignatureOption1Html(previewOrigin);
  const preview2 = buildEmailSignatureOption2Html(previewOrigin);
  const clipboard1 = buildEmailSignatureOption1Html(copyBaseUrl);
  const clipboard2 = buildEmailSignatureOption2Html(copyBaseUrl);

  const handleCopy = async (option: 1 | 2) => {
    const html = option === 1 ? clipboard1 : clipboard2;
    setBusyOption(option);
    try {
      await copyHtmlToClipboard(html);
      toast.success(copy.copiedToast);
    } catch {
      toast.error(copy.copyErrorToast);
    } finally {
      setBusyOption(null);
    }
  };

  return (
    <>
      <HeaderHero
        className="!min-h-[40vh]"
        description={copy.hero.description}
        eyebrowColor="#F2C53D"
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={copy.hero.eyebrow}
        title={copy.hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <main
        className={cn(
          'container mx-auto max-w-3xl px-4 py-12 text-neutral-700',
          'md:px-20 md:py-16',
        )}
      >
        <div className="space-y-4 font-barlow leading-relaxed">
          {copy.introParagraphs.map((paragraph, index) => (
            <p className="text-sm text-neutral-600 md:text-base" key={index}>
              {paragraph}
            </p>
          ))}
        </div>

        <section className="mt-14 space-y-10 border-t border-neutral-200 pt-12">
          <div>
            <h2 className="mb-2 font-barlow-condensed text-lg font-semibold text-neutral-900 md:text-xl">
              {copy.option1Title}
            </h2>
            <p className="mb-4 text-sm text-neutral-600">{copy.option1Description}</p>
            <Button
              aria-label={copy.copyOption1AriaLabel}
              disabled={busyOption !== null}
              onClick={() => {
                void handleCopy(1);
              }}
              size="sm"
              trackClick="email_signature_copy_option_1"
              type="button"
              variant="secondary"
            >
              {copy.copyButton}
            </Button>
            <p className="mb-2 mt-8 text-xs font-medium uppercase tracking-wide text-neutral-500">
              {copy.previewHeading}
            </p>
            {/* Static table HTML from lib/helpers/emailSignatureHtml */}
            <div
              className={cn(
                'overflow-x-auto rounded-lg border border-neutral-200 p-6',
                'bg-[#eef1f3]',
              )}
              dangerouslySetInnerHTML={{ __html: preview1 }}
            />
          </div>

          <div>
            <h2 className="mb-2 font-barlow-condensed text-lg font-semibold text-neutral-900 md:text-xl">
              {copy.option2Title}
            </h2>
            <p className="mb-4 text-sm text-neutral-600">{copy.option2Description}</p>
            <Button
              aria-label={copy.copyOption2AriaLabel}
              disabled={busyOption !== null}
              onClick={() => {
                void handleCopy(2);
              }}
              size="sm"
              trackClick="email_signature_copy_option_2"
              type="button"
              variant="secondary"
            >
              {copy.copyButton}
            </Button>
            <p className="mb-2 mt-8 text-xs font-medium uppercase tracking-wide text-neutral-500">
              {copy.previewHeading}
            </p>
            <div
              className={cn(
                'overflow-x-auto rounded-lg border border-neutral-200 p-6',
                'bg-[#eef1f3]',
              )}
              dangerouslySetInnerHTML={{ __html: preview2 }}
            />
          </div>
        </section>
      </main>
    </>
  );
}
