"use client"

import { useState, useRef, useEffect } from 'react'
import { Search, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react'

// Simple Markdown simple parser to bold text and highlight citations
const formatResponse = (text: string) => {
    // Convert [1], [2] into visible styled badges
    let formatted = text.replace(/\[(\d+)\]/g, (match, p1) => {
        return `<span class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-blue-100 bg-blue-600 rounded-full mx-1 shadow-sm">${p1}</span>`
    })

    // Convert standard markdown bold **text** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Format standard URLs to be clickable links
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">$1</a>')

    return formatted
}

export default function ChatInterface() {
    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchComplete, setSearchComplete] = useState(false)

    const [currentQuery, setCurrentQuery] = useState('')
    const [response, setResponse] = useState('')

    const [messages, setMessages] = useState<{ role: string, content: string }[]>([])

    const endOfMessagesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [response])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim() || isSearching) return

        setIsSearching(true)
        setSearchComplete(false)
        const q = query;

        let currentHistory = [...messages]
        if (currentQuery && response) {
            currentHistory = [...currentHistory, { role: 'user', content: currentQuery }, { role: 'assistant', content: response }]
            setMessages(currentHistory)
        }

        setCurrentQuery(q)
        setResponse('')
        setQuery('') // clear input

        try {
            const res = await fetch('http://localhost:8000/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: q, history: currentHistory }),
            })

            if (!res.body) throw new Error("No response body")

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let done = false

            while (!done) {
                const { value, done: doneReading } = await reader.read()
                done = doneReading
                const chunkValue = decoder.decode(value)
                setResponse((prev) => prev + chunkValue)
            }
        } catch (error) {
            console.error("Search error:", error)
            setResponse("An error occurred while searching. Please ensure the backend is running and API keys are set.")
        } finally {
            setIsSearching(false)
            setSearchComplete(true)
        }
    }

    // Handle enter key form submission
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch(e as unknown as React.FormEvent);
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-center max-w-4xl mx-auto p-4 md:p-8 w-full">

            {/* Show Initial Search if NO current query is active */}
            {!currentQuery && (
                <div className="flex flex-col items-center justify-center space-y-8 w-full min-h-[50vh]">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Where knowledge begins
                    </h1>

                    <form onSubmit={handleSearch} className="w-full relative shadow-2xl rounded-2xl group">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            className="w-full bg-gray-900 border border-gray-700/50 rounded-2xl px-6 py-4 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none overflow-hidden transition-all text-gray-100 placeholder-gray-500 shadow-inner block"
                            rows={1}
                            style={{ minHeight: '60px' }}
                        />
                        <button
                            type="submit"
                            disabled={!query.trim() || isSearching}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:bg-blue-500"
                        >
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <ArrowRight className="w-5 h-5 text-white" />}
                        </button>
                    </form>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                        <div className="flex items-center gap-1 hover:text-gray-300 cursor-pointer transition-colors"><Search className="w-4 h-4" /> Pro Search</div>
                        <div className="flex items-center gap-1 hover:text-gray-300 cursor-pointer transition-colors"><LinkIcon className="w-4 h-4" /> Attach</div>
                    </div>
                </div>
            )}

            {/* Show Results Stream */}
            {currentQuery && (
                <div className="flex flex-col w-full h-full pb-32">
                    <div className="flex-1 overflow-y-auto space-y-8 w-full pt-8 pb-4 scrollbar-thin scrollbar-thumb-gray-800">

                        {messages.map((msg, idx) => (
                            <div key={idx} className="space-y-4 w-full">
                                {msg.role === 'user' ? (
                                    <div className="text-2xl font-semibold text-gray-100 pb-2 border-b border-gray-800">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg pb-6">
                                        <div dangerouslySetInnerHTML={{ __html: formatResponse(msg.content) }} className="space-y-4 whitespace-pre-wrap" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* User Query Bubble */}
                        <div className="text-2xl font-semibold text-gray-100 mb-6 pb-6 border-b border-gray-800">
                            {currentQuery}
                        </div>

                        {/* AI Response Container */}
                        <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg">
                            <div
                                dangerouslySetInnerHTML={{ __html: formatResponse(response) }}
                                className="space-y-4 whitespace-pre-wrap"
                            />

                            {isSearching && (
                                <span className="inline-block w-3 h-5 ml-1 bg-blue-500 animate-pulse align-middle rounded-sm"></span>
                            )}
                        </div>

                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Fixed Bottom Input for follow-up */}
                    <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 md:p-8 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
                        <form onSubmit={handleSearch} className="max-w-4xl mx-auto relative shadow-2xl rounded-2xl group">
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a follow-up..."
                                className="w-full bg-gray-900 border border-gray-700/50 rounded-2xl px-6 py-4 pr-16 text-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none overflow-hidden transition-all text-gray-100 placeholder-gray-500 shadow-inner block"
                                rows={1}
                            />
                            <button
                                type="submit"
                                disabled={!query.trim() || isSearching}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:bg-blue-500"
                            >
                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <ArrowRight className="w-5 h-5 text-white" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
