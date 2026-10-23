import { LANDING_IMG } from './landingAssets';

type BrandLogoProps = {
  /** Square mark size in px (default 24). */
  size?: 20 | 24 | 28;
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<BrandLogoProps['size']>, string> = {
  20: 'brand-logo-mark brand-logo-mark--20',
  24: 'brand-logo-mark brand-logo-mark--24',
  28: 'brand-logo-mark brand-logo-mark--28',
};

export function BrandLogo({ size = 24, className }: BrandLogoProps) {
  return (
    <img
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`${SIZE_CLASS[size]} shrink-0 object-contain object-center ${className ?? ''}`.trim()}
      src={LANDING_IMG.logo}
    />
  );
}
