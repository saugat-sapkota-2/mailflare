"use client";

import Link from "next/link";
import { HelpCircle, Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ComposeProvider } from "@/components/compose/compose-context";
import { FloatingComposer } from "@/components/compose/floating-composer";
import { MailboxProvider } from "@/components/mailbox-provider";
import { MailboxSelector } from "@/components/mailbox-selector";
import { LicenseIndicator } from "@/components/license-indicator";
import { AdminNav } from "@/components/admin-nav";
import { SidebarProvider } from "@/components/sidebar-state";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { adminPageTitles } from "@/components/admin-page-titles";
import { SidebarAside, MobileTopBar } from "@/components/sidebar-aside";
import { SidebarResizeBoundary } from "@/components/sidebar-resize-boundary";
import { ShortcutsProvider } from "@/components/shortcuts";

const primaryOnlyPrefixes = [
  "/agent",
  "/api-keys",
  "/webhooks",
  "/backups",
  "/branding",
  "/licenses",
  "/activity",
  "/audit-logs",
  "/general",
  "/ai-usage",
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const requirePrimary = primaryOnlyPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const mobileTitleKey = adminPageTitles[pathname];
  const mobileTitle = mobileTitleKey ? t(mobileTitleKey) : undefined;

  return (
    <AuthGuard requireMailbox requireRole="admin" requirePrimary={requirePrimary}>
      <SidebarProvider expandedWidth={256} mobileOverlay>
      <MailboxProvider>
        <ComposeProvider>
          <ShortcutsProvider>
          <div className="grid h-dvh grid-cols-[minmax(0,1fr)] md:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] overflow-hidden bg-[#f6f8fc] transition-[grid-template-columns]" style={{ transitionDuration: "var(--sidebar-transition-duration)" }}>
            <SidebarAside>
              <div className="h-full">
                <AdminNav />
              </div>
              <SidebarResizeBoundary />
            </SidebarAside>
            <div className="flex min-h-0 min-w-0 flex-col">
                            <MobileTopBar title={mobileTitle} />
              <span className="fixed top-2 right-4 flex items-center gap-4 z-90">
                <LicenseIndicator />
                <MailboxSelector />
              </span>
              <main className={clsx("page-flush min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-tl-3xl max-md:rounded-t-3xl max-md:bg-white max-md:pb-24 px-6 py-10 scrollbar-gutter-stable lg:px-12", mobileTitle && "max-md:[&_h1]:hidden")}>
                <div className="w-full max-w-3xl">{children}</div>
              </main>
            </div>
            <FloatingComposer />
          </div>
          </ShortcutsProvider>
        </ComposeProvider>
      </MailboxProvider>
      </SidebarProvider>
    </AuthGuard>
  );
}
