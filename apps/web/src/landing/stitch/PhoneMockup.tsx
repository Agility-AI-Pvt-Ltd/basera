type PhoneMockupProps = {
  src: string;
  alt: string;
  className?: string;
};

/** App screenshot only — no device chrome (screenshots are full UI captures). */
export function PhoneMockup({ src, alt, className }: PhoneMockupProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] h-auto block rounded-2xl shadow-[0_12px_40px_-8px_rgba(44,27,51,0.18)] ${className ?? ''}`.trim()}
    />
  );
}
