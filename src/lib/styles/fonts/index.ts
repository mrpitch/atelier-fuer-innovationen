import { Roboto, Almendra, Roboto_Mono } from 'next/font/google'

export const fontSans = Roboto({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	variable: '--font-sans',
})

export const fontSerif = Almendra({
	weight: ['400', '700'],
	subsets: ['latin'],
	variable: '--font-serif',
})

export const fontMono = Roboto_Mono({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	variable: '--font-mono',
})
