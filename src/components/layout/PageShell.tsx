export default function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="page-shell">
      <div className={wide ? "page-content-wide" : "page-content"}>
        {children}
      </div>
    </div>
  );
}
