import { Link as LinkIcon } from 'lucide-react';
import { displayableLinks, splitTextWithUrls } from '../../../shared/links';

export function LinkChips({ links }: { links: string }) {
  const items = displayableLinks(links);
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Links">
      {items.map((link, index) => (
        <li key={`${link.url}-${index}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 text-xs font-medium text-accent hover:underline"
          >
            <LinkIcon aria-hidden size={13} strokeWidth={2} />
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Plain text with any http(s) URLs turned into links. React escapes everything else. */
export function LinkifiedText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words">
      {splitTextWithUrls(text).map((part, index) =>
        part.kind === 'link' ? (
          <a
            key={index}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            {part.url}
          </a>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </p>
  );
}
