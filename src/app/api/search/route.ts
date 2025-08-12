import { source } from '@/lib/source'
import { createFromSource } from 'fumadocs-core/search/server'

// output: standalone, server side api route
// export const { GET } = createFromSource(source);

// output: export, client side api route
// it should be cached forever
export const revalidate = false

export const { staticGET: GET } = createFromSource(source)
