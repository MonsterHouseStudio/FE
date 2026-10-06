import * as XLSX from 'xlsx'
import type { Country, CompetitionSavePayload } from '@/types'

/**
 * '2026 대회 일정표' 형식의 엑셀을 시합 일정(Competition) 등록 payload 로 변환.
 *
 * 지원 시트 레이아웃(헤더 행 자동 탐지):
 *   · 리저널/프로퀄리파이어: 월 | 일 | 요일 | 단체 | 대회이름 | 지역 | 도핑테스트 여부
 *   · 프로전(Male/Female):   월 | 일 | 요일 | 단체 | 지역 | 대회 | (포지션 O/X ...)
 * '공지' 등 안내 시트는 건너뜁니다.
 */

const JP_RE = /일본|japan|tokyo|osaka|도쿄|오사카|요코하마|나고야|후쿠오카|삿포로|고베|교토/i

// 한국어로 표기된 해외 국가/지역 (리저널·프로퀄에 등장)
const FOREIGN = [
  '미국', '영국', '브라질', '아르메니아', '이라크', '대만', '중국', '캐나다', '호주',
  '독일', '프랑스', '스페인', '이탈리아', '태국', '베트남', '인도', '필리핀', '말레이시아',
  '싱가포르', '인도네시아', '멕시코', '아르헨티나', '칠레', '러시아', '우크라이나', '폴란드',
  '네덜란드', '벨기에', '스위스', '오스트리아', '스웨덴', '노르웨이', '핀란드', '덴마크',
  '포르투갈', '그리스', '터키', '튀르키예', '이집트', '사우디', '아랍', '카타르', '바레인',
  '쿠웨이트', '이란', '파키스탄', '몽골', '카자흐스탄', '우즈베키스탄', '아제르바이잔',
  '조지아', '홍콩', '마카오', '뉴질랜드', 'usa', 'uk', 'u.s.',
]

/** 장소 문자열로 국가를 추정. 일본 > 해외 > 국내(KR) 순. */
export function detectCountry(place: string): Country {
  const s = (place || '').trim()
  if (!s) return 'KR'
  if (JP_RE.test(s)) return 'JP'
  const lower = s.toLowerCase()
  if (FOREIGN.some((f) => lower.includes(f))) return 'OVERSEAS'
  // 영문 지명(예: "Columbus, OH, USA")은 해외 (일본은 위에서 걸러짐)
  if (/[a-z]/i.test(s)) return 'OVERSEAS'
  // 한글/숫자만 + 외국 키워드 없음 → 국내
  return 'KR'
}

function toInt(v: unknown): number | null {
  if (v == null) return null
  const n = parseInt(String(v).replace(/[^\d.-]/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

function clean(v: unknown): string {
  return String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function validDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

function findCol(header: string[], keys: string[]): number {
  return header.findIndex((h) => keys.some((k) => h.includes(k)))
}

function parseSheet(rows: unknown[][], year: number): CompetitionSavePayload[] {
  // 헤더 행 탐지: '월' 과 '단체' 가 같이 있는 행
  let hr = -1
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const r = (rows[i] || []).map(clean)
    if (r.includes('월') && r.some((c) => c.includes('단체'))) {
      hr = i
      break
    }
  }
  if (hr < 0) return []

  const header = (rows[hr] || []).map(clean)
  const cMonth = findCol(header, ['월', 'Month'])
  const cDay = findCol(header, ['일', 'Day'])
  const cDow = findCol(header, ['요일'])
  const cHost = findCol(header, ['단체', 'Association'])
  const cName = findCol(header, ['대회이름', '대회명'])
  const cNameAlt = findCol(header, ['대회', 'Competition'])
  const nameCol = cName >= 0 ? cName : cNameAlt
  const cPlace = findCol(header, ['지역', '장소', 'Location', '회장'])
  const cDoping = findCol(header, ['도핑'])

  if (cMonth < 0 || cDay < 0 || nameCol < 0) return []

  const out: CompetitionSavePayload[] = []
  for (let i = hr + 1; i < rows.length; i++) {
    const r = rows[i] || []
    const month = toInt(r[cMonth])
    const day = toInt(r[cDay])
    if (!month || !day || !validDate(year, month, day)) continue
    const name = clean(r[nameCol])
    if (!name) continue

    const host = cHost >= 0 ? clean(r[cHost]) : ''
    const place = cPlace >= 0 ? clean(r[cPlace]) : ''
    const dow = cDow >= 0 ? clean(r[cDow]) : ''
    const doping = cDoping >= 0 ? clean(r[cDoping]) : ''

    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const descParts: string[] = []
    if (dow) descParts.push(`${dow}요일`)
    if (doping) descParts.push(`도핑테스트 ${doping}`)
    const description = descParts.join(' · ') || null

    out.push({
      country: detectCountry(place),
      startDate: date,
      endDate: date,
      link: '',
      published: true,
      translations: [
        {
          locale: 'KO',
          name,
          description,
          place: place || null,
          host: host || null,
        },
      ],
    })
  }
  return out
}

export interface ParsedCompetitions {
  items: CompetitionSavePayload[]
  bySheet: { name: string; count: number }[]
  byCountry: Record<Country, number>
  year: number
}

export async function parseCompetitionExcel(file: File): Promise<ParsedCompetitions> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  // 연도 추정: 어느 셀에서든 20xx 를 찾고, 없으면 2026
  let year = 2026
  outer: for (const sheet of wb.SheetNames.slice(0, 2)) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheet], { header: 1, defval: '' })
    for (const row of rows.slice(0, 3)) {
      for (const cell of row as unknown[]) {
        const m = String(cell ?? '').match(/20(\d{2})/)
        if (m) {
          year = parseInt('20' + m[1], 10)
          break outer
        }
      }
    }
  }

  const items: CompetitionSavePayload[] = []
  const bySheet: { name: string; count: number }[] = []
  // 날짜+대회명+장소로 중복 제거 (프로전 Male/Female 시트에 같은 대회가 중복됨)
  const seen = new Set<string>()
  for (const name of wb.SheetNames) {
    if (/공지|notice|변경|안내|readme/i.test(name)) continue
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: '' })
    const parsed = parseSheet(rows as unknown[][], year)
    let added = 0
    for (const it of parsed) {
      const tr = it.translations[0]
      const key = `${it.startDate}|${(tr?.name ?? '').toLowerCase()}|${(tr?.place ?? '').toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push(it)
      added++
    }
    if (added > 0) bySheet.push({ name, count: added })
  }

  const byCountry: Record<Country, number> = { KR: 0, JP: 0, OVERSEAS: 0 }
  for (const it of items) byCountry[it.country]++

  return { items, bySheet, byCountry, year }
}
