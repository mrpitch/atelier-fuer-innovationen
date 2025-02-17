'use client'
import { useState } from 'react'

import Image from 'next/image'

import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const previewButtonVariants = cva(
	'w-20 h-9 text-sm font-medium transition-colors rounded-full',
	{
		variants: {
			active: {
				true: 'text-fd-primary-foreground',
				false: 'text-fd-muted-foreground',
			},
		},
	}
)

export function PreviewImages() {
	const [active, setActive] = useState(0)

	return (
		<div className="mt-12 -mb-40 min-w-[800px] lg:-mb-18 xl:-mx-24 xl:min-w-[1100px]">
			<div className="bg-fd-card dark:shadow-fd-background absolute bottom-4 left-1/2 z-[2] flex -translate-1/2 flex-row rounded-full border p-1 shadow-xl">
				<div
					role="none"
					className="bg-fd-primary absolute z-[-1] h-9 w-20 rounded-full transition-transform"
					style={{
						transform: `translateX(calc(var(--spacing) * 20 * ${active}))`,
					}}
				/>
				<button
					className={`cursor-pointer ${cn(
						previewButtonVariants({ active: active === 0 })
					)}`}
					onClick={() => setActive(0)}
				>
					Obazda
				</button>
				<button
					className={`cursor-pointer ${cn(
						previewButtonVariants({ active: active === 1 })
					)}`}
					onClick={() => setActive(1)}
				>
					Da Kini
				</button>
			</div>
			<div className="overflow-hidden rounded-xs opacity-80 dark:opacity-50">
				<Image
					src="/images/home-1.jpg"
					alt="preview"
					width={1100}
					height={620}
					priority
					className={cn(
						'animate-in fade-in slide-in-from-bottom-12 w-full duration-1000 [mask-image:linear-gradient(to_bottom,white_70%,transparent_90%)] select-none',
						active !== 0 && 'hidden'
					)}
				/>
				{active === 1 && (
					<Image
						src="/images/home-2.jpg"
						alt="preview"
						width={1100}
						height={6200}
						priority
						className={cn(
							'animate-in fade-in slide-in-from-bottom-12 w-full duration-1000 [mask-image:linear-gradient(to_bottom,white_70%,transparent_90%)] select-none',
							active !== 1 && 'hidden'
						)}
					/>
				)}
			</div>
		</div>
	)
}
