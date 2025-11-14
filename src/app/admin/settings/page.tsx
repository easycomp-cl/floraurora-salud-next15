import SystemSettingsPanel from "@/components/admin-panel/settings/SystemSettingsPanel";
import CarouselManagerPanel from "@/components/admin-panel/settings/CarouselManagerPanel";

export default function AdminSettingsPage() {
  return (
    <section className="space-y-6">
      <SystemSettingsPanel />
      <CarouselManagerPanel />
    </section>
  );
}
