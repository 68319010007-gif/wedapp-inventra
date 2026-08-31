import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShoppingCart, Search, LayoutDashboard, ArrowUpRight, Mail, Phone } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useStoreAuth } from '../store/StoreAuthContext';
import { useLanguage } from '../i18n';
import LanguageSwitcher, { LanguageSwitcherLight } from '../components/LanguageSwitcher';
import CategoryMegaMenu from '../components/store/CategoryMegaMenu';
import Avatar from '../components/Avatar';
import BrandLogo from '../components/BrandLogo';
import { useSiteSettings } from '../store/SiteSettingsContext';

export default function StoreLayout() {
  const { totalItems } = useCart();
  const { isAuthenticated, customer, logout } = useStoreAuth();
  const { t } = useLanguage();
  const { storeTagline } = useSiteSettings();

  return (
    <div className="min-h-screen bg-surface font-sans">
      <div className="hidden bg-navy px-4 py-2 text-[11px] text-white/65 lg:block"><div className="mx-auto flex max-w-7xl justify-between"><span>วัสดุก่อสร้างคุณภาพ สำหรับทุกโปรเจกต์</span><span>สต็อกเรียลไทม์ · จัดส่งทั่วประเทศ</span></div></div>
      <header className="sticky top-0 z-40 border-b border-[#e5e7e2] bg-[#fdfdfb]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8 lg:py-4">
          <Link to="/" className="shrink-0">
            <BrandLogo
              logoUrl="/inventra-logo-v5.png"
              layout="stack"
              showText={false}
              subtitle={storeTagline || t('store.buildingStore')}
              subtitleClassName="text-[10px] uppercase tracking-wider text-muted"
              imageClassName="h-10 w-auto lg:h-11"
            />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <CategoryMegaMenu />
            <NavLink to="/" end className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}>
              {t('store.home')}
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}>
              {t('store.shop')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcherLight className="hidden sm:flex" />
            <Link to="/shop" className="hidden rounded-full border border-[#dfe4df] p-2.5 text-muted transition hover:border-primary hover:text-primary sm:block">
              <Search size={18} />
            </Link>
            <Link to="/cart" className="relative rounded-full bg-navy p-2.5 text-white transition hover:bg-primary">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/account/orders" className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary sm:block">
                  {t('store.myOrders')}
                </Link>
                <Link to="/account" className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 hover:border-primary">
                  <Avatar src={customer?.avatar} name={customer?.name} size="sm" />
                  <span className="hidden text-xs font-medium text-slate-700 sm:inline">{customer?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="hidden text-xs text-muted hover:text-red-500 sm:block">{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <LanguageSwitcher className="sm:hidden" />
                <Link to="/login" className="text-sm font-medium text-primary hover:underline">{t('store.login')}</Link>
              </div>
            )}

            <Link to="/admin" className="hidden items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-muted hover:text-primary lg:flex">
              <LayoutDashboard size={14} />
              {t('store.admin')}
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 pb-3 text-sm font-semibold text-navy md:hidden">
          <Link to="/shop" className="shrink-0 text-primary">{t('store.productCategories')}</Link>
          <Link to="/" className="shrink-0">{t('store.home')}</Link>
          <Link to="/shop" className="shrink-0">{t('store.shop')}</Link>
        </nav>
      </header>

      <main><Outlet /></main>

      <footer className="bg-[#0b1d18] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-10 md:grid-cols-[1.3fr_.8fr_1fr]">
            <div>
              <div className="inline-flex rounded-xl bg-white px-4 py-3"><BrandLogo logoUrl="/inventra-logo-v5.png" layout="stack" showText={false} imageClassName="h-10 w-auto" subtitleClassName="hidden" /></div>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">แหล่งรวมวัสดุก่อสร้างสำหรับช่าง ผู้รับเหมา และเจ้าของบ้าน พร้อมข้อมูลสต็อกที่ช่วยให้วางแผนงานได้ง่ายขึ้น</p>
              <Link to="/shop" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#49d7a8]">เลือกซื้อสินค้า <ArrowUpRight size={16} /></Link>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.15em] text-white/85">{t('store.categories')}</p>
              <ul className="mt-5 space-y-3 text-sm text-white/55">
                <li>Cement & Concrete</li>
                <li>Steel & Rebar</li>
                <li>Tiles & Flooring</li>
                <li>Sanitary Ware</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.15em] text-white/85">{t('store.contact')}</p>
              <div className="mt-5 space-y-3 text-sm text-white/55"><p className="flex items-center gap-3"><Mail size={16} /> support@inventra.com</p><p className="flex items-center gap-3"><Phone size={16} /> 02-123-4567</p></div>
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row"><p>© 2026 INVENTRA. All rights reserved.</p><p>สร้างงานให้เดินหน้าได้ทุกวัน</p></div>
        </div>
      </footer>
    </div>
  );
}
