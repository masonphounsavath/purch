import { cn } from '../../lib/utils'

// ── Motion ────────────────────────────────────────────────────
export const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

// ── Layout ────────────────────────────────────────────────────
// Page-width wrapper used by every section
export const container = 'mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-16'
// Narrower wrapper for reading-heavy and form pages
export const containerNarrow = 'mx-auto max-w-[880px] px-5 sm:px-8'

// ── Type ──────────────────────────────────────────────────────
export const heroHeading = 'font-outfit text-[44px] sm:text-6xl lg:text-[80px] leading-[0.96] font-extrabold tracking-[-0.035em]'
export const sectionHeading = 'font-outfit text-4xl sm:text-5xl lg:text-[56px] leading-none font-extrabold tracking-[-0.035em]'
export const subHeading = 'font-outfit text-4xl lg:text-[44px] font-extrabold tracking-[-0.03em]'
export const cardHeading = 'font-outfit text-xl font-bold tracking-[-0.01em]'
export const lede = 'text-lg lg:text-[19px] leading-normal text-brand-muted'
export const textLink = 'text-base font-medium underline underline-offset-4 hover:text-brand-sky-ink transition-colors'

// ── Form fields ───────────────────────────────────────────────
export const fieldLabel = 'block text-sm font-semibold text-brand-navy mb-1.5'
export const field = 'w-full px-4 py-3 rounded-[10px] border border-brand-line bg-white text-[15px] text-brand-navy placeholder:text-brand-muted/70 outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25 transition'
export const fieldError = 'text-sm text-red-600 mt-1.5'
export const fieldHint = 'text-[13px] text-brand-muted mt-1.5'

// ── Buttons ───────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'dark' | 'outline' | 'ghost'
type ButtonSize = 'lg' | 'md' | 'sm'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-sky text-brand-navy font-bold hover:brightness-105',
  dark:    'bg-brand-navy text-white font-semibold hover:bg-[#0C3A66]',
  outline: 'border border-brand-line bg-white text-brand-navy font-semibold hover:bg-brand-mist',
  ghost:   'text-brand-navy font-semibold hover:bg-brand-mist',
}

const buttonSizes: Record<ButtonSize, string> = {
  lg: 'h-14 px-[30px] text-[17px]',
  md: 'px-[26px] py-4 text-[17px]',
  sm: 'h-11 px-5 text-[15px]',
}

// Pill-cornered buttons from the landing page. Works on <button> and <Link>.
export function button(variant: ButtonVariant = 'primary', size: ButtonSize = 'lg', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-[10px] transition disabled:opacity-60 disabled:cursor-not-allowed',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  )
}
