import type { ReactNode } from 'react'

import { RootProvider } from 'fumadocs-ui/provider'
import '@/lib/styles/globals.css'
import { cn } from '@/lib/cn'

import {
	typeNextRegular,
	typeNextLight,
	typeNextSemiBold,
	typeNextBold,
} from '@/lib/styles/fonts/index'

import { Footer } from '@/app/_components/footer'

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={cn(
				'h-full min-h-screen font-sans antialiased',
				typeNextRegular.variable,
				typeNextLight.variable,
				typeNextSemiBold.variable,
				typeNextBold.variable
			)}
			suppressHydrationWarning
		>
			<body className="flex min-h-screen flex-col">
				<RootProvider>{children}</RootProvider>
				<Footer />
			</body>
		</html>
	)
}
