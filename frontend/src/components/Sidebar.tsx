"use client"

import { useEffect, useState } from 'react'
import { History, Search, MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'

type SessionGroupResponse = {
    session_id: string
    title: string
    created_at: string
}

export default function Sidebar() {
    const [history, setHistory] = useState<SessionGroupResponse[]>([])
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        let isSubscribed = true

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        fetch(`${apiUrl}/api/history`)
            .then(res => res.json())
            .then(data => {
                if (isSubscribed && Array.isArray(data)) {
                    setHistory(data)
                }
            })
            .catch(err => console.error("Error fetching history:", err))

        return () => {
            isSubscribed = false
        }
    }, [])

    if (!isMounted) {
        return <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex" /> // Empty placeholder
    }

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex h-full">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-2 text-xl font-bold text-gray-100">
                <div className="flex items-center gap-2">
                    <Search className="w-6 h-6 text-blue-500" />
                    AI Search
                </div>
                <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white" title="New Chat">
                    <Plus className="w-5 h-5" />
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Recent Searches
                </div>

                <div className="space-y-2">
                    {history.length === 0 ? (
                        <div className="text-sm text-gray-500 italic">No history yet.</div>
                    ) : (
                        history.map((item) => (
                            <Link
                                href={`/?chatId=${item.session_id}`}
                                key={item.session_id}
                                className="text-sm text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded cursor-pointer truncate flex items-center gap-2 transition-colors block"
                                title={item.title}
                            >
                                <MessageSquare className="w-4 h-4 shrink-0 text-gray-500" />
                                <span className="truncate">{item.title}</span>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </aside>
    )
}
