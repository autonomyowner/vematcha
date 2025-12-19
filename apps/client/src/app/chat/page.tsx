'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from '../../components/LanguageProvider';
import { api, Conversation, Message, AnalysisData } from '../../lib/api';
import { VoiceTherapySession } from '../../components/VoiceTherapySession';


const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const SUGGESTIONS = [
  { 
    label: "Vent about my day", 
    prompt: "I need to vent about my day. It's been really stressful and I just need someone to listen.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10 10 10 0 0 0-10-10z" opacity="0.1"/>
        <path d="M8 12h8m-4-4v8"/>
      </svg>
    ) 
  },
  { 
    label: "Analyze a decision", 
    prompt: "I'm trying to make a difficult decision and I'm feeling stuck. Can you help me think through it?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  },
  { 
    label: "Understanding anxiety", 
    prompt: "I've been feeling really anxious lately and I want to understand why.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    )
  },
];

export default function ChatPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { t } = useLanguage();

  const [conversations, setConversations] = useState<(Conversation & { messages: Message[] })[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);
  const [showVoiceSession, setShowVoiceSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isSignedIn, isLoaded, router]);

  // Close panels on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // On desktop, open sidebar by default
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
        setAnalysisPanelOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      setIsLoading(true);
      const response = await api.getConversations(token);
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) {
      loadConversations();
    }
  }, [isSignedIn, loadConversations]);

  const loadConversation = async (conversationId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      setIsLoading(true);
      const conversation = await api.getConversation(token, conversationId);
      setActiveConversationId(conversationId);
      setMessages(conversation.messages || []);

      // Load existing analysis from conversation
      if (conversation.emotionalState || conversation.biases || conversation.patterns) {
        setCurrentAnalysis({
          emotionalState: conversation.emotionalState || { primary: 'neutral', intensity: 'low' },
          biases: conversation.biases || [],
          patterns: conversation.patterns || [],
          insights: conversation.insights || [],
        });
      } else {
        setCurrentAnalysis(null);
      }

      // Close sidebar on mobile after selecting
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setCurrentAnalysis(null);
    inputRef.current?.focus();
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId || '',
      role: 'USER',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.sendMessage(token, userMessage, activeConversationId || undefined);

      if (!activeConversationId) {
        setActiveConversationId(response.conversationId);
        loadConversations();
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        { ...tempUserMessage, id: `user-${Date.now()}`, conversationId: response.conversationId },
        response.message,
      ]);

      // Update analysis with new data
      if (response.analysis) {
        setCurrentAnalysis(response.analysis);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      setInputValue(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      if (!token) return;

      await api.deleteConversation(token, conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      if (activeConversationId === conversationId) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Navigate to Flash Session
  const handleStartFlashSession = () => {
    router.push('/flash-session');
  };

  // Handle voice session end
  const handleVoiceSessionEnd = useCallback((transcript: string[]) => {
    setShowVoiceSession(false);

    if (transcript.length > 0) {
      // Add transcript messages to chat
      const voiceMessages: Message[] = transcript.map((text, index) => {
        const isUser = text.startsWith('You:');
        return {
          id: `voice-${Date.now()}-${index}`,
          conversationId: activeConversationId || '',
          role: isUser ? 'USER' : 'ASSISTANT',
          content: text.replace(/^(You|Matcha): /, ''),
          createdAt: new Date().toISOString(),
        };
      });
      setMessages(prev => [...prev, ...voiceMessages]);
    }
  }, [activeConversationId]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center" style={{ background: 'var(--cream-50)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  const intensityColors = {
    low: 'var(--matcha-400)',
    moderate: 'var(--terra-400)',
    high: 'var(--terra-600)',
  };

  return (
    <div className="h-[calc(100vh-64px)] flex relative" style={{ background: 'var(--cream-50)' }}>
      {/* Mobile Overlay */}
      {(sidebarOpen || analysisPanelOpen) && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => {
            setSidebarOpen(false);
            setAnalysisPanelOpen(false);
          }}
        />
      )}

      {/* Conversations Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-30
          w-full sm:w-72 lg:w-72
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
          lg:transition-all lg:duration-300
        `}
        style={{
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-soft)',
          top: '64px',
          height: 'calc(100vh - 64px)',
        }}
      >
        <div className="h-full flex flex-col w-full sm:w-72">
          <div className="p-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-soft)' }}>
            <button
              onClick={startNewConversation}
              className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-600) 100%)',
                color: 'var(--text-inverse)',
                boxShadow: '0 4px 14px rgba(104, 166, 125, 0.35)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {t.chat?.newChat || 'New Chat'}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg sm:hidden flex-shrink-0 transition-colors hover:bg-[var(--cream-100)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading && conversations.length === 0 ? (
              <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                {t.chat?.noConversations || 'No conversations yet'}
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group p-3 rounded-xl mb-1 cursor-pointer transition-all flex items-center justify-between ${
                    activeConversationId === conv.id ? 'bg-[var(--matcha-50)]' : 'hover:bg-[var(--cream-100)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {conv.title || 'New conversation'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {conv.messages?.[0]?.content?.slice(0, 30) || ''}
                      {(conv.messages?.[0]?.content?.length || 0) > 30 ? '...' : ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Flash Session button for mobile */}
          <div className="p-4 border-t sm:hidden" style={{ borderColor: 'var(--border-soft)' }}>
            <button
              onClick={() => {
                setSidebarOpen(false);
                router.push('/flash-session');
              }}
              className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all"
              style={{
                background: 'var(--cream-100)',
                color: 'var(--matcha-600)',
                border: '1px solid var(--matcha-200)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Flash Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div
          className="h-14 flex items-center justify-between px-3 sm:px-4 flex-shrink-0"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-soft)' }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--cream-100)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="text-base sm:text-lg font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {t.chat?.title || 'Chat with Matcha'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartFlashSession}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hidden sm:flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-600) 100%)',
                color: 'white',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Flash Session
            </button>
          </div>
          <button
            onClick={() => setAnalysisPanelOpen(!analysisPanelOpen)}
            className={`p-2 rounded-lg transition-colors hidden sm:flex ${analysisPanelOpen ? 'bg-[var(--matcha-100)]' : 'hover:bg-[var(--cream-100)]'}`}
            style={{ color: analysisPanelOpen ? 'var(--matcha-600)' : 'var(--text-secondary)' }}
            title="Toggle Analysis Panel"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4M12 8h.01"></path>
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <div className="text-center px-4 max-w-2xl w-full">
                  <div
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transform rotate-3 transition-transform hover:rotate-6"
                    style={{ 
                      background: 'linear-gradient(135deg, var(--matcha-100), var(--cream-100))',
                      boxShadow: 'var(--shadow-md)' 
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--matcha-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <h2
                    className="text-2xl sm:text-3xl mb-3 font-medium"
                    style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: 'var(--text-primary)' }}
                  >
                    {t.chat?.welcomeTitle || 'How are you feeling today?'}
                  </h2>
                  <p className="text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t.chat?.welcomeSubtitle || "I'm here to listen and help you understand your thoughts and feelings."}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputValue(suggestion.prompt);
                          inputRef.current?.focus();
                        }}
                        className="p-4 rounded-xl text-left transition-all hover:-translate-y-1"
                        style={{ 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border-soft)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div className="mb-2" style={{ color: 'var(--matcha-600)' }}>
                          {suggestion.icon}
                        </div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {suggestion.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex flex-col ${message.role === 'USER' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === 'USER' ? 'rounded-br-sm' : 'rounded-bl-sm'
                      }`}
                      style={{
                        background: message.role === 'USER'
                          ? 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-600) 100%)'
                          : 'var(--bg-card)',
                        color: message.role === 'USER' ? 'var(--text-inverse)' : 'var(--text-primary)',
                        border: message.role === 'USER' ? 'none' : '1px solid var(--border-soft)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{message.content}</p>
                    </div>
                    {message.createdAt && (
                      <span 
                        className="text-[10px] sm:text-xs mt-1 px-1 opacity-60"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {formatTime(message.createdAt)}
                      </span>
                    )}
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="p-3 sm:p-4 rounded-2xl rounded-bl-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--matcha-400)] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-[var(--matcha-400)] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-[var(--matcha-400)] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 flex-shrink-0" style={{ background: 'var(--cream-50)' }}>
          <div className="max-w-4xl mx-auto">
            <div
              className="flex items-end gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', boxShadow: 'var(--shadow-md)' }}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.chat?.inputPlaceholder || 'Type your message...'}
                className="flex-1 resize-none bg-transparent outline-none max-h-32 text-sm sm:text-base"
                style={{ color: 'var(--text-primary)' }}
                rows={1}
                disabled={isSending}
              />
              <button
                onClick={() => setShowVoiceSession(true)}
                className="p-3 rounded-xl transition-all duration-200 flex-shrink-0 hover:scale-[1.02]"
                style={{
                  color: 'var(--matcha-600)',
                  background: 'var(--cream-100)',
                  border: '1px solid var(--matcha-200)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--matcha-100)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(104, 166, 125, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--cream-100)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Start voice conversation"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isSending}
                className="p-2.5 sm:p-3 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-600) 100%)', color: 'var(--text-inverse)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Analysis Panel */}
      <div
        className={`
          fixed lg:relative inset-y-0 right-0 z-30
          w-80 sm:w-80
          transform transition-transform duration-300 ease-in-out
          ${analysisPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
          lg:transition-all lg:duration-300
        `}
        style={{
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-soft)',
          top: '64px',
          height: 'calc(100vh - 64px)',
        }}
      >
        <div className="h-full flex flex-col w-80 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
            <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--matcha-500)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
              Real-time Analysis
            </h2>
            <button
              onClick={() => setAnalysisPanelOpen(false)}
              className="p-1 rounded lg:hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {!currentAnalysis ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'var(--cream-200)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Analysis will appear here as you chat
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {/* Emotional State */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Emotional State
                </h3>
                <div className="p-3 rounded-xl" style={{ background: 'var(--cream-100)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize text-sm" style={{ color: 'var(--text-primary)' }}>
                      {currentAnalysis.emotionalState.primary}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: `${intensityColors[currentAnalysis.emotionalState.intensity]}20`,
                        color: intensityColors[currentAnalysis.emotionalState.intensity],
                      }}
                    >
                      {currentAnalysis.emotionalState.intensity}
                    </span>
                  </div>
                  {currentAnalysis.emotionalState.secondary && (
                    <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                      Secondary: {currentAnalysis.emotionalState.secondary}
                    </p>
                  )}
                </div>
              </div>

              {/* Thinking Patterns */}
              {currentAnalysis.patterns && currentAnalysis.patterns.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Thinking Patterns
                  </h3>
                  <div className="space-y-2">
                    {currentAnalysis.patterns.map((pattern, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: 'var(--text-primary)' }}>{pattern.name}</span>
                          <span style={{ color: 'var(--matcha-600)' }}>{pattern.percentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cream-200)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pattern.percentage}%`,
                              background: 'linear-gradient(90deg, var(--matcha-400), var(--matcha-600))',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cognitive Biases */}
              {currentAnalysis.biases && currentAnalysis.biases.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Cognitive Biases
                  </h3>
                  <div className="space-y-2">
                    {currentAnalysis.biases.slice(0, 3).map((bias, i) => (
                      <div key={i} className="p-2.5 rounded-lg" style={{ background: 'var(--cream-100)' }}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
                            {bias.name}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--terra-500)' }}>
                            {Math.round(bias.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {bias.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {currentAnalysis.insights && currentAnalysis.insights.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Key Insights
                  </h3>
                  <div className="space-y-2">
                    {currentAnalysis.insights.slice(0, 3).map((insight, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg text-xs leading-relaxed"
                        style={{
                          background: 'linear-gradient(135deg, var(--matcha-50), var(--cream-100))',
                          borderLeft: '2px solid var(--matcha-500)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Complete Badge */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--matcha-600)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Analysis complete
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Session Modal */}
      {showVoiceSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            animation: 'fadeIn 200ms ease',
          }}
        >
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div
            className="relative w-full max-w-2xl mx-4"
            style={{ animation: 'slideUp 300ms ease' }}
          >
            <button
              onClick={() => setShowVoiceSession(false)}
              className="absolute -top-12 right-0 p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <VoiceTherapySession
              sessionType="general-therapy"
              onSessionEnd={handleVoiceSessionEnd}
            />
          </div>
        </div>
      )}

    </div>
  );
}
