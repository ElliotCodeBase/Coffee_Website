/* Renders Terms/Privacy content saved via Admin → Legal Pages. Plain text
   only, split into paragraphs on blank lines — no markdown/HTML parsing,
   so there is no markup an admin could get wrong or that could carry
   injected content. */
export default function LegalPageBody({ content }: { content: string | null }) {
  if (!content) return null;

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="text-stone-600 text-sm leading-relaxed whitespace-pre-line mt-4 first:mt-0">
          {paragraph}
        </p>
      ))}
    </>
  );
}
