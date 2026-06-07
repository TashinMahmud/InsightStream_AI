"use client"

import { useState, useRef, useEffect } from 'react'
import { Search, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react'
import { useQueryState } from 'nuqs'

// Simple Markdown simple parser to bold text and highlight citations
const formatResponse = (text: string) => {
    let formatted = text;

    // Convert standard markdown bold **text** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Convert Markdown citation links: [[1]](https://url.com) or [1](https://url.com)
    formatted = formatted.replace(/\[?\[(\d+)\]\]?\((https?:\/\/[^\s\)]+)\)/g, (match, p1, p2) => {
        return `<a href="${p2}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 pb-0.5 text-xs font-bold text-blue-100 bg-blue-600 rounded-full mx-1 shadow-sm hover:bg-blue-500 transition-colors no-underline">${p1}</a>`
    })

    // Handle standard markdown links: [Text](https://url.com)
    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">$1</a>')

    return formatted
}

export default function ChatInterface() {
    const [chatId, setChatId] = useQueryState('chatId')

    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // Current streaming state
    const [currentQuery, setCurrentQuery] = useState('')
    const [response, setResponse] = useState('')

    // Rendered message history
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([])

    // Trigger scroll-to-bottom automatically
    const endOfMessagesRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [response, messages])

    // Detect URL changes to reload older chats natively
    useEffect(() => {
        if (!chatId) {
            // New Chat State
            setMessages([]);
            setCurrentQuery('');
            setResponse('');
            return;
        }

        // Fetch old history safely
        let isActive = true;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        fetch(`${apiUrl}/api/history/${chatId}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (!isActive || !Array.isArray(data) || data.length === 0) return;

                // Restore messages log chronologically
                const restored: { role: string, content: string }[] = [];
                data.forEach((item: any) => {
                    restored.push({ role: 'user', content: item.query });
                    restored.push({ role: 'assistant', content: item.response });
                });

                setMessages(restored);

                // We blank out the active streaming 'response' and 'currentQuery' visually
                // because everything is housed within the finished 'messages' block now.
                setCurrentQuery('');
                setResponse('');
            })
            .catch(err => console.error("Error loading chat:", err));

        return () => { isActive = false; }
    }, [chatId])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim() || isSearching) return

        setIsSearching(true)

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
            const payload = {
                query: q,
                history: currentHistory,
                session_id: chatId || null // Send the active chat ID if continuing
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (!res.body) throw new Error("No response body")

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let done = false

            while (!done) {
                const { value, done: doneReading } = await reader.read()
                done = doneReading

                if (value) {
                    const chunkValue = decoder.decode(value, { stream: true })

                    // We must intercept the very first JSON token containing the session ID
                    if (chunkValue.includes('{"session_id":')) {
                        try {
                            // Extract just the first line (the JSON payload)
                            const [jsonStr, ...rest] = chunkValue.split('\n');
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.session_id && parsed.session_id !== chatId) {
                                // Update URL query parameter seamlessly
                                setChatId(parsed.session_id);
                            }

                            // Inject remaining text data (if chunks overlapped)
                            if (rest.length > 0) {
                                setResponse((prev) => prev + rest.join('\n'));
                            }
                            continue;

                        } catch (e) {
                            console.error("Failed to parse session ID payload", e);
                        }
                    }

                    // Otherwise, safely append standard text to UI stream
                    setResponse((prev) => prev + chunkValue)
                }
            }
        } catch (error) {
            console.error("Search error:", error)
            setResponse("An error occurred while searching. Please ensure the backend is running and API keys are set.")
        } finally {
            setIsSearching(false)
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

            {/* Show Initial Search if NO current query is active and NO history is loaded */}
            {!currentQuery && messages.length === 0 && (
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
            {(currentQuery || messages.length > 0) && (
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

                        {/* Show Active Stream Container ONLY if searching or streaming */}
                        {currentQuery && (
                            <>
                                <div className="text-2xl font-semibold text-gray-100 mb-6 pb-6 border-b border-gray-800">
                                    {currentQuery}
                                </div>
                                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg">
                                    <div
                                        dangerouslySetInnerHTML={{ __html: formatResponse(response) }}
                                        className="space-y-4 whitespace-pre-wrap"
                                    />
                                    {isSearching && (
                                        <span className="inline-block w-3 h-5 ml-1 bg-blue-500 animate-pulse align-middle rounded-sm"></span>
                                    )}
                                </div>
                            </>
                        )}

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
