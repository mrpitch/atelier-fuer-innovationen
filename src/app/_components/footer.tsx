import Link from 'next/link'

export const Footer = () => {
	return (
		<footer className="text-secondary-foreground mx-auto w-full border-t py-4">
			<div className="mx-12">
				<Link
					className="hover:text-primary-foreground text-xs"
					href="/impressum"
				>
					Impressum
				</Link>
			</div>
		</footer>
	)
}
