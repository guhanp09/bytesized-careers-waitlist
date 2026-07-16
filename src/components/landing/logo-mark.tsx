import Image from 'next/image';

/**
 * The canonical ByteSized Careers mark: a serif "B" in a double-ruled plate, pressed at a
 * slight angle. The SVG is shared with email, favicon, and social assets so the identity
 * does not drift between the product and its messages.
 */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/brand/bytesized-careers-mark.svg"
      alt=""
      aria-hidden="true"
      width={28}
      height={28}
      priority
      unoptimized
      className={`size-7 shrink-0 -rotate-[5deg] ${className}`}
    />
  );
}
