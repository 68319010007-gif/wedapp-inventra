import { useSiteSettings } from '../store/SiteSettingsContext';

function BrandTitle({ name, className }) {
  if (name.toLowerCase() === 'inventra') {
    return (
      <p className={className}>
        Inven<span className="text-primary">tra</span>
      </p>
    );
  }
  return <p className={className}>{name}</p>;
}

export default function BrandLogo({
  className = '',
  imageClassName = 'h-10 w-auto',
  layout = 'row',
  showText = true,
  showSubtitle = true,
  title,
  subtitle,
  useSettingsTagline = false,
  textClassName = 'text-lg font-semibold text-navy',
  subtitleClassName = 'text-[10px] uppercase tracking-wider text-muted',
  logoUrl: logoUrlProp,
  variant = 'store',
}) {
  const { logoUrl: storeLogo, adminLogoUrl, appName, appTagline } = useSiteSettings();
  const contextLogo = variant === 'admin' ? adminLogoUrl : storeLogo;
  const logoUrl = logoUrlProp || contextLogo;
  const displayTitle = title ?? appName;
  const displaySubtitle =
    subtitle ?? (useSettingsTagline && appTagline?.trim() ? appTagline.trim() : null);

  const isStack = layout === 'stack';

  return (
    <div
      className={`flex gap-2.5 ${isStack ? 'flex-col items-start' : 'items-center'} ${className}`}
    >
      <img
        src={logoUrl}
        alt={displayTitle}
        className={`shrink-0 object-contain ${imageClassName}`}
      />
      {(showText && displayTitle) || (showSubtitle && displaySubtitle) ? (
        <div className={`min-w-0 ${isStack ? 'w-full' : ''}`}>
          {showText && displayTitle && (
            <BrandTitle name={displayTitle} className={textClassName} />
          )}
          {showSubtitle && displaySubtitle && (
            <p className={`${subtitleClassName} ${showText && displayTitle && isStack ? 'mt-0.5' : ''}`}>
              {displaySubtitle}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
