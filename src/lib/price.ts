import type { TFunction } from 'i18next'
import type { Locale } from '@/i18n'
import type { PriceUnit, Product } from '@/types'
import { formatPrice } from './utils'

/**
 * 가격 단위 접미사. 통역만 "/1일", "/1시간" 이 붙습니다.
 * 문자열을 상품명에 섞어 저장하면 다국어 표기를 만들 수 없어서
 * 서버는 enum 만 주고 표기는 여기서 만듭니다.
 */
export function priceUnitSuffix(unit: PriceUnit, t: TFunction): string {
  if (unit === 'PER_DAY') return t('shooting.perDay')
  if (unit === 'PER_HOUR') return t('shooting.perHour')
  return ''
}

export function formatProductPrice(product: Product, locale: Locale, t: TFunction): string {
  return formatPrice(product.price, locale) + priceUnitSuffix(product.priceUnit, t)
}

/** 상품 기본가 + 선택 옵션 합계 */
export function calcTotal(
  product: Product | undefined,
  selected: Record<number, number>,
): number {
  if (!product) return 0

  return (product.options ?? []).reduce(
    (sum, option) => sum + option.price * (selected[option.id] ?? 0),
    product.price,
  )
}
