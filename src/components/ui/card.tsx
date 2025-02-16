import * as React from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	icon?: React.ReactNode
	title?: string
	children?: React.ReactNode
}

export default function Card({
	icon,
	title,
	children,
	className,
	...props
}: CardProps) {
	return (
		<div className={cn('rounded-lg border p-6', className)} {...props}>
			{icon && <div className="mb-4">{icon}</div>}
			{title && <h3 className="mb-2 text-lg font-medium">{title}</h3>}
			<div className="text-muted-foreground text-sm">{children}</div>
		</div>
	)
}

export function Cards({
	children,
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn('grid gap-6 sm:grid-cols-2', className)} {...props}>
			{children}
		</div>
	)
}
