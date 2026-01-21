import dynamic from 'next/dynamic'

const LibraryRouterClient = dynamic(() => import('./LibraryRouterClient'))

export default function LibraryDynamicPage() {
  return <LibraryRouterClient />
}
