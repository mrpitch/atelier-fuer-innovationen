import { source } from '@/lib/source'
import {
	DocsPage,
	DocsBody,
	DocsDescription,
	DocsTitle,
} from '@fumadocs/base-ui/page'
import { notFound } from 'next/navigation'
import defaultMdxComponents from '@fumadocs/base-ui/mdx'
import {
	kontexteRedirects,
	resolveKontexteRedirect,
} from '@/data/kontexte-redirects'
import { KontexteRedirect } from '@/components/kontexte-redirect'

export default async function Page(props: {
	params: Promise<{ slug?: string[] }>
}) {
	const params = await props.params
	const redirectTo = resolveKontexteRedirect(params.slug)
	if (redirectTo) {
		return (
			<DocsPage>
				<DocsTitle>Weiterleitung</DocsTitle>
				<DocsBody>
					<KontexteRedirect to={redirectTo} />
				</DocsBody>
			</DocsPage>
		)
	}

	const page = source.getPage(params.slug)
	if (!page) notFound()

	const MDX = page.data.body

	return (
		<DocsPage toc={page.data.toc} full={page.data.full}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX components={{ ...defaultMdxComponents }} />
			</DocsBody>
		</DocsPage>
	)
}

export async function generateStaticParams() {
	const redirectParams = Object.keys(kontexteRedirects).map((slug) => ({
		slug: ['xeniapolis', 'kontexte', slug],
	}))
	return [...(await source.generateParams()), ...redirectParams]
}

export async function generateMetadata(props: {
	params: Promise<{ slug?: string[] }>
}) {
	const params = await props.params
	if (resolveKontexteRedirect(params.slug)) {
		return { title: 'Weiterleitung', robots: { index: false, follow: false } }
	}

	const page = source.getPage(params.slug)
	if (!page) notFound()

	return {
		title: page.data.title,
		description: page.data.description,
	}
}
