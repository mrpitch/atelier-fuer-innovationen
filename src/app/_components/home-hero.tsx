import Link from 'next/link'
import { cn } from '@/lib/cn'
import { buttonVariants } from '@/components/ui/button'
import { PreviewImages } from '@/app/(home)/page.client'

export function HomeHero() {
	return (
		<div className="bg-fd-card/80 relative z-[2] flex flex-col border border-x px-6 pt-12 max-lg:overflow-hidden max-md:text-center md:px-12 md:pt-16">
			<h1 className="mb-8 text-4xl font-medium md:hidden">Jo mei mi mechad</h1>
			<h1 className="mb-8 max-w-[600px] text-4xl font-medium max-md:hidden">
				Bavaria ipsum dolor sit amet gscheid Boarischer Greichats
			</h1>
			<p className="text-fd-muted-foreground mb-8 md:max-w-[80%] md:text-xl">
				Di Gams Lewakaas, Baamwach auffi hi do. Engelgwand san Mongdratzal ded
				hob Servas Buam nimma ded Bussal di.
			</p>
			<div className="inline-flex items-center gap-3 max-md:mx-auto">
				<Link
					href="/docs"
					className={cn(
						buttonVariants({
							size: 'lg',
							color: 'secondary',
							className: 'rounded-full',
						})
					)}
				>
					Auf gehts
				</Link>
				<Link
					href="/docs/teil-1"
					className={cn(
						buttonVariants({
							size: 'lg',
							color: 'outline',
							className: 'bg-fd-background rounded-full',
						})
					)}
				>
					Auf’d Schellnsau
				</Link>
			</div>
			<PreviewImages />
		</div>
	)
}
