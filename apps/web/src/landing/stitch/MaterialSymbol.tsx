import type { CSSProperties } from 'react';

type MaterialSymbolProps = {
  name: string;
  /** Icon size in px (Material Symbols need explicit font-size). */
  size?: number;
  className?: string;
  fill?: boolean;
};

export function MaterialSymbol({ name, size = 24, className, fill }: MaterialSymbolProps) {
  const style: CSSProperties = {
    fontSize: size,
    width: size,
    height: size,
    fontVariationSettings: fill
      ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
      : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
  };

  return (
    <span
      className={`material-symbols-outlined inline-flex items-center justify-center shrink-0 leading-none ${className ?? ''}`.trim()}
      style={style}
      aria-hidden
    >
      {name}
    </span>
  );
}
