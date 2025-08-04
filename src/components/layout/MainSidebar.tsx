"use client";

import React from "react";
import { Home, Settings, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import Image from "next/image";

interface MainSidebarProps {
  sidebarOpen: boolean;
}

const MainSidebar: React.FC<MainSidebarProps> = ({ sidebarOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = trpc.auth.me.useQuery();

  const mainSidebarItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", href: "/dashboard" },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      href: "/dashboard/settings",
    },
  ];

  const handleNavigation = (item: (typeof mainSidebarItems)[0]) => {
    router.push(item.href);
  };

  return (
    <div
      className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r border-gray-200 transition-all duration-300 fixed top-16 left-0 h-[calc(100vh-4rem)] flex flex-col overflow-hidden z-40`}
    >
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="Whispr PDF Logo"
              width={62}
              height={54}
              className="rounded-sm"
            />
            {sidebarOpen && (
              <span className="font-bold text-lg text-gray-800">
                Whispr PDF
              </span>
            )}
          </Link>
        </div>
      </div>
      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        <div className="py-4 space-y-1">
          {mainSidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
      {/* Bottom Section - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100">
        {sidebarOpen ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MainSidebar;
