import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { detectLocale, isLocale, persistLocale } from '@/i18n'

// 셸과 첫 화면은 즉시 로드합니다(초기 페인트 지연 방지).
import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import { Spinner } from '@/components/ui/primitives'

// 나머지 공개 페이지 — 해당 라우트에 들어갈 때만 청크를 받습니다.
const ShootingPage = lazy(() => import('@/pages/ShootingPage'))
const BookingPage = lazy(() => import('@/pages/BookingPage'))
const MyBookingPage = lazy(() => import('@/pages/MyBookingPage'))
const SchedulePage = lazy(() => import('@/pages/SchedulePage'))
const InterpreterPage = lazy(() => import('@/pages/InterpreterPage'))
const GalleryPage = lazy(() => import('@/pages/GalleryPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const MediaPage = lazy(() => import('@/pages/MediaPage'))
const MediaDetailPage = lazy(() => import('@/pages/MediaDetailPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// 관리자 화면 — 일반 방문자는 이 코드를 받을 필요가 없습니다.
// 전부 분리해 /admin 에 들어갈 때만 로드합니다(초기 번들에서 제외).
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'))
const AdminSchedulePage = lazy(() => import('@/pages/admin/AdminSchedulePage'))
const AdminGalleryPage = lazy(() => import('@/pages/admin/AdminGalleryPage'))
const AdminPostsPage = lazy(() => import('@/pages/admin/AdminPostsPage'))
const AdminBannersPage = lazy(() => import('@/pages/admin/AdminBannersPage'))
const AdminHomeStatsPage = lazy(() => import('@/pages/admin/AdminHomeStatsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminInquiriesPage = lazy(() => import('@/pages/admin/AdminInquiriesPage'))
const AdminCalendarPage = lazy(() => import('@/pages/admin/AdminCalendarPage'))

/** 라우트 이동 시 스크롤을 맨 위로 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** lazy 페이지가 로드되는 동안 보여줄 화면. */
function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

/**
 * /:locale 세그먼트를 검증하고 i18n·<html lang> 을 동기화합니다.
 * 잘못된 언어 코드면 기본 언어로 돌려보냅니다.
 */
function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!isLocale(locale)) return
    void i18n.changeLanguage(locale)
    document.documentElement.lang = locale
    persistLocale(locale)
  }, [locale, i18n])

  if (!isLocale(locale)) {
    return <Navigate to={`/${detectLocale()}`} replace />
  }

  return <Layout />
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      {/* 모든 lazy 라우트를 하나의 Suspense 로 감쌉니다. */}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* 브라우저 언어로 최초 판별 후 리다이렉트 (기획서 §2.1) */}
          <Route path="/" element={<Navigate to={`/${detectLocale()}`} replace />} />

          <Route path="/:locale" element={<LocaleLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shooting" element={<ShootingPage />} />
            <Route path="shooting/booking" element={<BookingPage />} />
            <Route path="shooting/booking/lookup" element={<MyBookingPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="interpreter" element={<InterpreterPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="media/:slug" element={<MediaDetailPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* 관리자는 다국어 대상이 아닙니다 (운영자 = 한국어) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="schedule" element={<AdminSchedulePage />} />
            <Route path="gallery" element={<AdminGalleryPage />} />
            <Route path="posts" element={<AdminPostsPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="home-stats" element={<AdminHomeStatsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="inquiries" element={<AdminInquiriesPage />} />
            <Route path="calendar" element={<AdminCalendarPage />} />
          </Route>

          <Route path="*" element={<Navigate to={`/${detectLocale()}`} replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
