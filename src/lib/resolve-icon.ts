import { Building2, icons } from 'lucide-react'

/** A named lucide-react icon, falling back to `Building2` when unknown. */
export const resolveLucideIcon = (name: string) =>
	Object.hasOwn(icons, name) ? icons[name as keyof typeof icons] : Building2
