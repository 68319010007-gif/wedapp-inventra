export default function BrandLogo({
  className = '',
  imageClassName = 'h-10 w-auto',
  showText = true,
  subtitle,
  textClassName = 'text-lg font-semibold text-navy',
  subtitleClassName = 'text-[10px] uppercase tracking-wider text-muted',
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/inventra-logo.png"
        alt="Inventra"
        className={`shrink-0 object-contain ${imageClassName}`}
      />
      {showText && (
        <div className="min-w-0">
          <p className={textClassName}>
            Inven<span className="text-primary">tra</span>
          </p>
          {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
