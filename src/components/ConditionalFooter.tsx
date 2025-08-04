"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't render footer on dashboard pages
  const isDashboardPage = pathname?.startsWith("/dashboard");
  
  // Don't render footer on auth pages (login, register)
  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/register");
  
  // Don't render footer if it's a dashboard or auth page
  if (isDashboardPage || isAuthPage) {
    return null;
  }
  
  return <Footer />;
} 