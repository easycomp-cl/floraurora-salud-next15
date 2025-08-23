export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
