export type ShopProduct = {
  slug: string
  name: string
  provider: 'Codex' | 'Gemini'
  company: string
  description: string
  accent: 'codex' | 'gemini'
  credit: number
  price: number
  compatibility: string[]
}

const services = [
  { provider: 'Codex' as const, company: 'OpenAI', accent: 'codex' as const,
    description: 'Credit dành cho các tác vụ lập trình và quy trình phát triển với Codex.',
    compatibility: ['Codex', 'OpenAI compatible', 'SDK & CLI'],
    prices: { 10: 10000, 50: 50000, 100: 100000 } },
  { provider: 'Gemini' as const, company: 'Google', accent: 'gemini' as const,
    description: 'Credit dành cho ứng dụng đa phương thức, nội dung và phân tích với Gemini.',
    compatibility: ['Gemini', 'Google AI', 'SDK & API'],
    prices: { 10: 15000, 50: 75000, 100: 150000 } }
]

// Presentation-only estimates. These packages are not connected to checkout.
export const shopProducts: ShopProduct[] = services.flatMap(service =>
  ([10, 50, 100] as const).map(credit => ({
    slug: `${service.accent}-${credit}`,
    name: `${service.provider} ${credit}`,
    provider: service.provider,
    company: service.company,
    description: service.description,
    accent: service.accent,
    credit,
    price: service.prices[credit],
    compatibility: service.compatibility
  }))
)

export const formatVnd = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)}đ`
