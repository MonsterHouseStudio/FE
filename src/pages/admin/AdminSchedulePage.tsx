import { useTranslation } from 'react-i18next'
import { COMPETITIONS } from '@/mocks/data'
import { daysUntil, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader, DemoNotice } from './AdminLayout'

export default function AdminSchedulePage() {
  const { t } = useTranslation()
  const rows = [...COMPETITIONS.ko].sort((a, b) => b.startDate.localeCompare(a.startDate))
  const ja = COMPETITIONS.ja

  return (
    <>
      <AdminPageHeader
        title={t('admin.schedule')}
        action={<Button size="sm">+ {t('admin.actionAdd')}</Button>}
      />
      <DemoNotice />

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ink-800 text-[11px] uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-4 font-semibold">{t('schedule.country')}</th>
              <th className="px-5 py-4 font-semibold">{t('schedule.title')}</th>
              <th className="px-5 py-4 font-semibold">{t('admin.datetime')}</th>
              <th className="px-5 py-4 font-semibold">{t('schedule.place')}</th>
              <th className="px-5 py-4 font-semibold">JA</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rows.map((row) => {
              const d = daysUntil(row.startDate)
              const translated = ja.some((c) => c.id === row.id)
              return (
                <tr key={row.id} className="transition-colors hover:bg-ink-800/40">
                  <td className="px-5 py-4">
                    <Badge tone={row.country === 'KR' ? 'brand' : 'neutral'}>
                      {row.country === 'KR' ? t('schedule.korea') : t('schedule.japan')}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="mt-0.5 text-xs text-ink-500">{row.host}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-ink-200">
                    {formatDate(row.startDate, 'ko')}
                    <span
                      className={`ml-2 text-xs ${d < 0 ? 'text-ink-600' : 'text-brand-400'}`}
                    >
                      {d < 0 ? t('schedule.ended') : d === 0 ? t('schedule.ddayToday') : `D-${d}`}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink-300">{row.place}</td>
                  <td className="px-5 py-4">
                    <Badge tone={translated ? 'success' : 'warning'}>
                      {translated ? t('admin.translated') : t('admin.jaMissing')}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <Button size="sm" variant="ghost">
                      {t('admin.actionEdit')}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
