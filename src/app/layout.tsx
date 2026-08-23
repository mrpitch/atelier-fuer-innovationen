import type { ReactNode } from 'react'

import { RootProvider } from '@fumadocs/base-ui/provider/next'
import '@/lib/styles/globals.css'
import { cn } from '@/lib/cn'

import { fontSans, fontSerif, fontMono } from '@/lib/styles/fonts/index'

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={cn(
				'h-full min-h-screen font-sans antialiased',
				fontSans.variable,
				fontSerif.variable,
				fontMono.variable
			)}
			suppressHydrationWarning
		>
			<body className="flex min-h-screen flex-col">
				<RootProvider
					search={{
						options: {
							type: 'static',
						},
					}}
				>
					{children}
				</RootProvider>
			</body>
		</html>
	)
}
