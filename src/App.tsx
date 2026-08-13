import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { detectLocale, isLocale, persistLocale } from '@/i18n'

import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import ShootingPage from '@/pages/ShootingPage'
import BookingPage from '@/pages/BookingPage'
import SchedulePage from '@/pages/SchedulePage'
import InterpreterPage from '@/pages/InterpreterPage'
import GalleryPage from '@/pages/GalleryPage'
import AboutPage from '@/pages/AboutPage'
import MediaPage from '@/pages/MediaPage'
import MediaDetailPage from '@/pages/MediaDetailPage'
import PrivacyPage from '@/pages/PrivacyPage'
import NotFoundPage from '@/pages/NotFoundPage'

import AdminLayout from '@/pages/admin/AdminLayout'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage'
import AdminSchedulePage from '@/pages/admin/AdminSchedulePage'
import AdminGalleryPage from '@/pages/admin/AdminGalleryPage'
import AdminPostsPage from '@/pages/admin/AdminPostsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminInquiriesPage from '@/pages/admin/AdminInquiriesPage'
import AdminCalendarPage from '@/pages/admin/AdminCalendarPage'

/** 라우트 이동 시 스크롤을 맨 위로 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
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
      <Routes>
        {/* 브라우저 언어로 최초 판별 후 리다이렉트 (기획서 §2.1) */}
        <Route path="/" element={<Navigate to={`/${detectLocale()}`} replace />} />

        <Route path="/:locale" element={<LocaleLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shooting" element={<ShootingPage />} />
          <Route path="shooting/booking" element={<BookingPage />} />
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
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
        </Route>

        <Route path="*" element={<Navigate to={`/${detectLocale()}`} replace />} />
      </Routes>
    </>
  )
}
