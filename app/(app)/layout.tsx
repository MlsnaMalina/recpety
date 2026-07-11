import BottomNav from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 pb-40 pt-6">
      {children}
      <BottomNav />
    </div>
  );
}
