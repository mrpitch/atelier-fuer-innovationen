interface ISlide {
	slug: string
	name: string
	url: string
}

// interface ISlides {
// 	slides: ISlide[]
// }
const getSlidesData = async () => {
	try {
		// Using dynamic import for JSON
		const slidesData = await import('@/data/slides.json')
		return slidesData.slides as ISlide[]
	} catch (error) {
		console.error('Error loading slides:', error)
		return [] as ISlide[]
	}
}

const getSlideBySlug = async (slug: string) => {
	const slides = await getSlidesData()
	return slides.find((slide) => slide.slug === slug)
}

export const Slides = async () => {
	const slides = await getSlidesData()

	return (
		<div>
			{slides.map((slide) => (
				<div key={slide.name}>{slide.name}</div>
			))}
		</div>
	)
}

export const Slide = async ({ slug }: { slug: string }) => {
	const slide = await getSlideBySlug(slug)
	return <div>Single Slide: {slide?.name}</div>
}
