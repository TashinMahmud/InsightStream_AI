import ChatInterface from '@/components/ChatInterface'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="flex h-full w-full relative bg-gray-950">
      <Suspense fallback={<div className="flex flex-1 items-center justify-center text-gray-500">Loading Assistant...</div>}>
        <ChatInterface />
      </Suspense>
    </div>
  )
}
