import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background text-foreground h-full w-full overflow-hidden">
      {/* Main Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 h-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
