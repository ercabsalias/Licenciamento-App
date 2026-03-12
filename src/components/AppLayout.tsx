import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, User } from "lucide-react";

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Top Navbar */}
          <header className="h-14 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">
                Licenciamento
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-md hover:bg-muted text-muted-foreground">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Admin</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
