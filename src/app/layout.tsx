import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { LanguageProvider } from "@/components/language-provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDirection, loadMessages, resolveLocale } from "@/lib/i18n/utils";
import { sidebarBootstrapScript } from "@/components/sidebar-state-utils";
import { themeBootstrapScript } from "@/components/theme-utils";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Mailflare",
	description: "Multi-tenant email on Cloudflare",
	icons: { icon: "/api/branding/icon", apple: "/icon-192.png" },
	appleWebApp: {
		capable: true,
		title: "Mailflare",
		statusBarStyle: "default",
	},
	robots: {
		index: false,
		follow: false,
		noarchive: true,
		nosnippet: true,
		noimageindex: true,
		googleBot: {
			index: false,
			follow: false,
			noarchive: true,
			nosnippet: true,
			noimageindex: true,
		},
	},
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
	const messages = locale === DEFAULT_LOCALE ? undefined : await loadMessages(locale);
	return (
		<html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: sidebarBootstrapScript }} />
				<script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
				<link rel="icon" href="/api/branding/icon"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<LanguageProvider initialLocale={locale} initialMessages={messages}><Providers>{children}</Providers></LanguageProvider>
			</body>
		</html>
	);
}
