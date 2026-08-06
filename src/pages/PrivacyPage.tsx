import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'
import { PageHeader, Section } from '@/components/ui/primitives'

/**
 * 기획서 §9 — 예약·문의에서 개인정보를 수집하므로 필수 페이지입니다.
 * 일본 고객 데이터는 APPI 대상이라 일본어판도 함께 운영합니다.
 * 아래 문안은 초안이며, 실제 오픈 전 법률 검토가 필요합니다.
 */
const SECTIONS = {
  ko: [
    {
      title: '1. 수집하는 개인정보 항목',
      body: '촬영 예약: 이름, 연락처, 이메일, 요청사항\n통역·영상 문의: 이름, 연락처(전화 또는 LINE ID), 이메일, 문의 내용\n자동 수집: 접속 IP, 브라우저 정보, 방문 일시',
    },
    {
      title: '2. 개인정보의 수집·이용 목적',
      body: '예약 접수 및 확정 안내\n촬영 일정 조율과 결과물 전달\n문의에 대한 회신\n서비스 개선을 위한 통계 분석(식별 정보를 제외한 형태)',
    },
    {
      title: '3. 보유 및 이용 기간',
      body: '촬영 예약 정보: 촬영 완료일로부터 1년\n문의 내역: 처리 완료일로부터 6개월\n관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.\n보유 기간이 지난 정보는 지체 없이 파기합니다.',
    },
    {
      title: '4. 개인정보의 제3자 제공',
      body: '원칙적으로 제3자에게 제공하지 않습니다. 다만 이용자가 사전에 동의한 경우, 법령에 따라 요구받은 경우에 한해 제공될 수 있습니다.',
    },
    {
      title: '5. 초상권 및 게시 동의',
      body: '촬영 결과물 중 인물이 식별되는 사진·영상은 별도의 게시 동의를 받은 경우에만 홈페이지·SNS에 게시합니다.\n게시 후에도 언제든 삭제를 요청하실 수 있으며, 요청 시 지체 없이 처리합니다.',
    },
    {
      title: '6. 이용자의 권리',
      body: '이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다.\n요청은 아래 문의처로 접수해 주시기 바랍니다.',
    },
    {
      title: '7. 개인정보 보호책임자',
      body: '담당자: MONSTER HOUSE 운영팀\n이메일: privacy@monsterhouse.example',
    },
  ],
  ja: [
    {
      title: '1. 収集する個人情報の項目',
      body: '撮影予約: お名前、ご連絡先、メールアドレス、ご要望\n通訳・映像のお問い合わせ: お名前、ご連絡先(電話またはLINE ID)、メールアドレス、お問い合わせ内容\n自動収集: アクセスIP、ブラウザ情報、訪問日時',
    },
    {
      title: '2. 個人情報の収集・利用目的',
      body: 'ご予約の受付および確定のご案内\n撮影日程の調整と成果物のお渡し\nお問い合わせへのご返信\nサービス改善のための統計分析(識別情報を除いた形式)',
    },
    {
      title: '3. 保有および利用期間',
      body: '撮影予約情報: 撮影完了日から1年\nお問い合わせ履歴: 対応完了日から6か月\n関連法令により保存が必要な場合は、当該期間中保管します。\n保有期間を過ぎた情報は遅滞なく破棄します。',
    },
    {
      title: '4. 第三者への提供',
      body: '原則として第三者に提供しません。ただし、ご本人が事前に同意された場合、法令に基づき要求された場合に限り提供されることがあります。',
    },
    {
      title: '5. 肖像権および掲載の同意',
      body: '撮影成果物のうち人物が識別できる写真・映像は、別途掲載のご同意をいただいた場合にのみホームページ・SNSに掲載します。\n掲載後もいつでも削除をご請求いただけます。ご請求の際は遅滞なく対応いたします。',
    },
    {
      title: '6. ご本人の権利',
      body: 'ご本人はいつでもご自身の個人情報の開示・訂正・削除・利用停止を求めることができます。\nご請求は下記のお問い合わせ先までご連絡ください。',
    },
    {
      title: '7. 個人情報保護責任者',
      body: '担当: MONSTER HOUSE 運営チーム\nメール: privacy@monsterhouse.example',
    },
  ],
}

export default function PrivacyPage() {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <>
      <PageHeader eyebrow={t('privacy.subtitle')} title={t('privacy.title')} />

      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t('privacy.updated')} 2026-08-04
          </p>

          <div className="mt-10 space-y-10">
            {SECTIONS[locale].map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-lg tracking-tightest text-white">
                  {section.title}
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-[1.9] text-ink-300">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <p className="mt-14 rounded-lg border border-ink-800 bg-ink-900/50 p-5 text-xs leading-relaxed text-ink-500">
            {locale === 'ja'
              ? '※ 本文書は草案です。公開前に法務確認が必要です。日本のお客様のデータは個人情報保護法(APPI)の対象となります。'
              : '※ 이 문서는 초안입니다. 오픈 전 법률 검토가 필요하며, 일본 고객 데이터는 일본 개인정보보호법(APPI) 적용 대상입니다.'}
          </p>
        </div>
      </Section>
    </>
  )
}
