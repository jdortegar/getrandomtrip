import TripperOffset from '@/components/tripper/TripperOffset';
import TripperSidebar from '@/components/tripper/TripperSidebar';
import TripperTopbar from '@/components/tripper/TripperTopbar';

export default function TripperLayout({ children }: { children: React.ReactNode }) {
  return (
    <TripperOffset>
      <div className="min-h-screen grid grid-cols-[260px_1fr]">
        {/* Sidebar: sticky bajo el header global */}
        <aside
          className="bg-neutral-950 text-white border-r border-neutral-200/60 sticky overflow-auto"
          style={{
            top: 'var(--rt-header-h, 64px)',
            height: 'calc(100vh - var(--rt-header-h, 64px))',
          }}
        >
          <TripperSidebar />
        </aside>

        {/* Contenido */}
        <main className="bg-neutral-50">
          <TripperTopbar />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </TripperOffset>
  );
}
