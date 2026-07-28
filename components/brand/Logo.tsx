import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  /** pixel height of the mark chip */
  size?: number
  showWordmark?: boolean
  href?: string | null
  className?: string
}

/**
 * Accrion logo lockup. The monogram's "A" is deep navy, so it sits on a
 * frosted light chip to stay legible on both the light and dark themes
 * (and on colored surfaces like the login panel). Wordmark is gradient text.
 */
export function Logo({ size = 34, showWordmark = true, href = '/advisor/dashboard', className = '' }: LogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="relative inline-flex items-center justify-center rounded-xl shrink-0 overflow-hidden"
        style={{
          height: size,
          width: size,
          background: 'linear-gradient(150deg, #ffffff 0%, #ece9f7 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 6px 20px -8px var(--glow-violet)',
        }}
      >
        <Image
          src="/logo-mark.png"
          alt="Accrion"
          width={size}
          height={size}
          priority
          className="object-contain"
          style={{ width: size * 0.72, height: 'auto' }}
        />
      </span>
      {showWordmark && (
        <span className="font-display font-bold tracking-tight text-[1.15rem] leading-none text-fg-primary">
          Accri<span className="gradient-text">on</span>
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} aria-label="Accrion home" className="inline-flex items-center">
        {content}
      </Link>
    )
  }
  return content
}
