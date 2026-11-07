import Link from 'next/link'
import { cn } from '@/lib/cn'
import { buttonVariants } from '@/components/ui/button'
import { PreviewImages } from '@/app/(home)/page.client'

export function HomeHero() {
	return (
		<div className="bg-fd-card/80 relative z-[2] flex flex-col border border-x px-6 pt-12 max-lg:overflow-hidden max-md:text-center md:px-12 md:pt-16">
			<h1 className="mb-8 text-4xl font-medium md:hidden">
				Städte des Wissens
			</h1>
			<h1 className="mb-8 max-w-[600px] text-4xl font-medium max-md:hidden">
				Städte des Wissens als Stätten der Begegnung
			</h1>
			<p className="text-fd-muted-foreground mb-8 md:max-w-[80%] md:text-xl">
				Xenia ist eine Wissensstadt am Wege zur Informationsgesellschaft: ein
				Forschungsprojekt, das den Übergang als begehbare Stadt mit einem
				Zentrum und acht Stadtvierteln erlebbar macht.
			</p>
			<div className="inline-flex items-center gap-3 max-md:mx-auto">
				<Link
					href="/docs/atelier"
					className={cn(
						buttonVariants({
							size: 'lg',
							color: 'secondary',
							className: 'rounded-full',
						})
					)}
				>
					Atelier
				</Link>
				<Link
					href="/docs/xeniapolis"
					className={cn(
						buttonVariants({
							size: 'lg',
							color: 'outline',
							className: 'bg-fd-background rounded-full',
						})
					)}
				>
					Xeniapolis
				</Link>
			</div>
			<PreviewImages />
		</div>
	)
}
