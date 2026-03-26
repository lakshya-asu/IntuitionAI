import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export default function Sidebar() {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  // Reset sidebar state when switching between mobile and desktop
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const navItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/curriculum", label: "My Curriculum", icon: "school" },
    { href: "/library", label: "Learning Library", icon: "local_library" },
    { href: "/calendar", label: "Learning Schedule", icon: "event" },
    { href: "/analytics", label: "My Analytics", icon: "analytics" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U';

  return (
    <aside className="w-full md:w-64 bg-[#0A0A0A] border-r border-white/5 md:min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center">
          <span className="material-icons text-primary text-3xl">psychology</span>
          <h1 className="ml-2 text-xl font-semibold text-primary">IntuitionAI</h1>
        </div>
        <button 
          className="md:hidden text-slate-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="material-icons">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>
      
      {isOpen && (
        <>
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#FEFFF5] flex items-center justify-center text-[#0D0D0D] font-bold">
                <span>{userInitials}</span>
              </div>
              <div>
                <h3 className="font-medium text-white">{user?.name || 'Guest User'}</h3>
                <p className="text-sm text-slate-500">{user?.level || 'Beginner'}</p>
              </div>
            </div>
          </div>
          
          <nav className="p-2 flex-1">
            <ul>
              {navItems.map((item) => (
                <li key={item.href} className="mb-1">
                  <Link href={item.href}>
                    <div className={`flex items-center p-3 rounded-full transition-all duration-300 ${
                      location === item.href 
                        ? 'text-[#0D0D0D] bg-[#FEFFF5] font-bold' 
                        : 'text-[#959C95] hover:bg-[#141414] hover:text-[#FEFFF5]'
                    }`}>
                      <span className="material-icons mr-3">{item.icon}</span>
                      {item.label}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <a href="#help" className="flex items-center text-slate-400 hover:text-primary">
              <span className="material-icons mr-3">help_outline</span>
              Help & Support
            </a>
          </div>
        </>
      )}
    </aside>
  );
}

// Helper to handle 401 responses
function getQueryFn({ on401 }: { on401: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: unknown[] }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  };
}
