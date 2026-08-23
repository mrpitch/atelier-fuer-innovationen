import { DocsLayout, type DocsLayoutProps } from '@fumadocs/base-ui/layouts/docs'
import { PathUtils } from 'fumadocs-core/source'
import { findPath, type Folder } from 'fumadocs-core/page-tree'
import type { ReactNode } from 'react'
import { baseOptions } from '@/app/layout.config'
import { source } from '@/lib/source'
import { Footer } from '@/app/_components/footer'

const docsOptions: DocsLayoutProps = {
	...baseOptions,
	githubUrl: 'https://github.com/mrpitch/atelier-fuer-innovationen',
	tree: source.pageTree,
	tabs: {
		transform(option, node) {
			const meta = source.getNodeMeta(node)
			if (!meta) return option

			const color = `var(--${PathUtils.dirname(meta.path)}-color, var(--color-fd-foreground))`

			return {
				...option,
				icon: (
					<div
						className="size-full [&_svg]:size-full max-md:rounded-md max-md:p-1.5 max-md:border max-md:bg-fd-secondary"
						style={{ color }}
					>
						{node.icon}
					</div>
				),
			}
		},
	},
}

/**
 * Same source.getNodeMeta() + PathUtils.dirname() pattern as the tabs transform above,
 * but resolved for the current page instead of the static tab list (see ADR-0002).
 */
function getPageSection(url: string): string | undefined {
	const treeNodes = findPath(
		source.pageTree.children,
		(node) => node.type === 'page' && node.url === url
	)
	const rootFolder = treeNodes?.find(
		(node): node is Folder => node.type === 'folder' && Boolean(node.root)
	)
	if (!rootFolder) return undefined

	const meta = source.getNodeMeta(rootFolder)
	return meta ? PathUtils.dirname(meta.path) : undefined
}

export default async function Layout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ slug?: string[] }>
}) {
	const { slug } = await params
	const page = source.getPage(slug)
	const isXeniapolis = page ? getPageSection(page.url) === 'xeniapolis' : false

	return (
		<div {...(isXeniapolis ? { 'data-section': 'xeniapolis' } : {})}>
			<DocsLayout {...docsOptions}>{children}</DocsLayout>
			<Footer />
		</div>
	)
}
