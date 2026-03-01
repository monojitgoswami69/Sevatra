import { useState, useEffect, useRef } from 'react';
import chatbotData from '../data/chatbot_responses.json';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type Message = {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    time: string;
};

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleOpenChatbot = () => setIsOpen(true);
        window.addEventListener('open-chatbot', handleOpenChatbot);
        return () => window.removeEventListener('open-chatbot', handleOpenChatbot);
    }, []);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMsg =
                chatbotData.greetings[
                Math.floor(Math.random() * chatbotData.greetings.length)
                ];
            addMessage(welcomeMsg, 'bot');
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (text: string, sender: 'bot' | 'user') => {
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString() + Math.random(),
                text,
                sender,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ]);
    };

    const getBotResponse = (userMessage: string) => {
        const msg = userMessage.toLowerCase();
        for (const data of Object.values(chatbotData.keywords)) {
            if (
                data.patterns &&
                data.patterns.some((pattern) => msg.includes(pattern.toLowerCase()))
            ) {
                const responses = data.responses || [];
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
        return chatbotData.fallback[
            Math.floor(Math.random() * chatbotData.fallback.length)
        ];
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;
        const msg = inputValue.trim();
        addMessage(msg, 'user');
        setInputValue('');

        setTimeout(() => {
            const response = getBotResponse(msg);
            addMessage(response, 'bot');
        }, 500);
    };

    const handleAction = (action: string, url: string, message: string) => {
        if (action === 'redirect' && url) {
            setIsOpen(false);
            navigate(url.replace('.html', ''));
        } else if (action === 'message' && message) {
            setInputValue(message);
            // Let the re-render happen before sending (optional handling)
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-primary-blue hover:bg-blue-600 text-white p-4 rounded-full shadow-glow 
                   transition-transform hover:scale-110 flex items-center justify-center animate-bounce"
                aria-label="Open Chatbot"
            >
                <span className="material-symbols-outlined text-3xl">chat</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 flex flex-col 
                       bg-white dark:bg-gray-900 sm:rounded-3xl shadow-2xl w-full sm:w-96 h-[85vh] sm:h-[600px] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-blue to-blue-600 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined">support_agent</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">AmbiSevatra Support</h3>
                                    <p className="text-xs opacity-90 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-success-green rounded-full animate-pulse"></span>
                                        Online - We're here to help
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2 items-start ${msg.sender === 'user' ? 'justify-end' : ''
                                        }`}
                                >
                                    {msg.sender === 'bot' && (
                                        <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-white text-sm">
                                                smart_toy
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`flex-1 rounded-2xl p-3 shadow-sm ${msg.sender === 'user'
                                                ? 'bg-primary-blue text-white rounded-tr-none max-w-[80%] ml-auto'
                                                : 'bg-white dark:bg-gray-700 text-text-dark dark:text-white rounded-tl-none'
                                            }`}
                                    >
                                        <p className="text-sm border-white whitespace-pre-line">{msg.text}</p>
                                        <p
                                            className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-white/70 text-right' : 'text-gray-400'
                                                }`}
                                        >
                                            {msg.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shrink-0">
                            <p className="text-xs text-text-gray dark:text-gray-400 mb-2 font-semibold">
                                Quick Actions:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {chatbotData.quick_actions?.slice(0, 6).map((action: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAction(action.action, action.url, action.message)}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary-blue hover:text-white dark:hover:bg-primary-blue 
                               text-text-dark dark:text-white rounded-lg text-xs font-semibold transition-all text-left truncate"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none 
                             focus:ring-2 focus:ring-primary-blue dark:bg-gray-800 dark:text-white text-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    className="px-4 py-3 bg-primary-blue text-white rounded-xl hover:bg-blue-600 transition-all shrink-0"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;
