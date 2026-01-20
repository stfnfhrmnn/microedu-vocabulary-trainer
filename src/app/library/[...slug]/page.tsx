import dynamic from 'next/dynamic'

const LibraryRouterClient = dynamic(() => import('./LibraryRouterClient'))

export const dynamicParams = false

export async function generateStaticParams() {
  return [{ slug: ['placeholder'] }]
}

export default function LibraryDynamicPage() {
  return <LibraryRouterClient />
}
