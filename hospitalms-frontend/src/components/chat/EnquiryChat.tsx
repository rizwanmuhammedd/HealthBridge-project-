import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSignalR } from '../../hooks/useSignalR';
import { MessageSquare, Send, X, User, Headset, Clock } from 'lucide-react';
import { Button, Input } from '../ui';
import { chatApi } from '../../api/axiosInstance';

interface ChatMessage {
    patientId: string;
    patientName?: string;
    receptionistName?: string;
    message: string;
    timestamp: string;
    isFromPatient: boolean;
}

export const EnquiryChat = () => {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chats, setChats] = useState<ChatMessage[]>([]);
    const [activePatientId, setActivePatientId] = useState<string | null>(null);
    const [patientList, setPatientList] = useState<{id: string, name: string, unreadCount?: number, latestMessage?: string}[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch initial history and patient list
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const loadInitial = async () => {
            try {
                if (user.role === 'Receptionist') {
                    const res = await chatApi.getHistory();
                    setPatientList(res.data.map((p: any) => ({ 
                        id: p.patientId, 
                        name: p.patientName || `Patient #${p.patientId}`,
                        unreadCount: p.unreadCount,
                        latestMessage: p.latestMessage
                    })));
                } else {
                    const res = await chatApi.getHistory();
                    setChats(res.data.map((m: any) => ({
                        patientId: m.patientId,
                        patientName: m.patientName,
                        receptionistName: m.receptionistName,
                        message: m.message,
                        timestamp: m.timestamp,
                        isFromPatient: m.isFromPatient
                    })));
                }
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };

        loadInitial();
    }, [user, isAuthenticated]);

    // Fetch specific patient history for receptionist and mark as read
    useEffect(() => {
        if (user?.role === 'Receptionist' && activePatientId) {
            const loadPatientHistory = async () => {
                try {
                    const res = await chatApi.getHistory(activePatientId);
                    setChats(res.data.map((m: any) => ({
                        patientId: m.patientId,
                        patientName: m.patientName,
                        receptionistName: m.receptionistName,
                        message: m.message,
                        timestamp: m.timestamp,
                        isFromPatient: m.isFromPatient
                    })));

                    // Mark as read in backend
                    await chatApi.markAsRead(activePatientId);
                    
                    // Clear unread count locally
                    setPatientList(prev => prev.map(p => 
                        p.id === activePatientId ? { ...p, unreadCount: 0 } : p
                    ));
                } catch (err) {
                    console.error("Failed to load patient history", err);
                }
            };
            loadPatientHistory();
        }
    }, [activePatientId, user]);

    // Filter and SORT chats for the current view
    const currentChats = user?.role === 'Receptionist' 
        ? chats.filter(c => c.patientId === activePatientId)
        : chats;

    const signalR = useSignalR([
        {
            event: 'ReceiveEnquiry',
            handler: (enquiry: any) => {
                setChats(prev => {
                    const isDuplicate = prev.some(c => 
                        c.patientId === enquiry.patientId && 
                        c.message === enquiry.message && 
                        Math.abs(new Date(c.timestamp).getTime() - new Date(enquiry.timestamp).getTime()) < 3000
                    );
                    if (isDuplicate) return prev;
                    return [...prev, enquiry];
                });

                // For receptionist, ensure patient is in the list and AT THE TOP
                if (user?.role === 'Receptionist') {
                    setPatientList(prev => {
                        const existing = prev.find(p => p.id === enquiry.patientId);
                        const others = prev.filter(p => p.id !== enquiry.patientId);
                        
                        const updatedPatient = {
                            id: enquiry.patientId,
                            name: enquiry.patientName || existing?.name || `Patient #${enquiry.patientId}`,
                            unreadCount: (existing?.unreadCount || 0) + (activePatientId === enquiry.patientId ? 0 : 1),
                            latestMessage: enquiry.timestamp
                        };

                        // Put the updated patient at the very top (WhatsApp style)
                        return [updatedPatient, ...others];
                    });
                    
                    if (!activePatientId) {
                        setActivePatientId(enquiry.patientId);
                    }
                }
            }
        }
    ], isAuthenticated);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chats, isOpen, activePatientId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msgContent = message.trim();
        if (!msgContent || !signalR.current) return;

        const now = new Date().toISOString();
        const tempMsg: ChatMessage = {
            patientId: user?.role === 'Receptionist' ? activePatientId! : (user?.id.toString() || ''),
            message: msgContent,
            timestamp: now,
            isFromPatient: user?.role !== 'Receptionist',
            patientName: user?.role !== 'Receptionist' ? user?.fullName : undefined,
            receptionistName: user?.role === 'Receptionist' ? user?.fullName : undefined
        };

        try {
            // Local echo first for immediate UI response
            setChats(prev => [...prev, tempMsg]);
            setMessage('');

            if (user?.role === 'Receptionist') {
                if (!activePatientId) return;
                await signalR.current.invoke('ReplyEnquiry', activePatientId, msgContent);
            } else {
                await signalR.current.invoke('SendEnquiry', user?.fullName || 'Patient', msgContent);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    if (!isAuthenticated) return null;

    // Determination logic moved into effect/state for sorting
    const activePatients = user?.role === 'Receptionist' ? patientList : [];

    if (user?.role === 'Receptionist') {
        return (
            <div className="flex flex-col h-[600px] bg-white border border-zinc-200 rounded-[24px] shadow-sm overflow-hidden">
                <div className="flex border-b border-zinc-100 h-full">
                    {/* Patient List */}
                    <div className="w-72 border-r border-zinc-100 flex flex-col">
                        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                            <h3 className="text-[13px] font-bold text-zinc-900 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-emerald-500" /> Active Enquiries
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {activePatients.length === 0 ? (
                                <div className="p-8 text-center text-zinc-400">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-[11px] font-medium">No messages yet</p>
                                </div>
                            ) : (
                                activePatients.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setActivePatientId(p.id)}
                                        className={`w-full p-4 text-left border-b border-zinc-50 transition-colors flex items-center gap-3 relative ${activePatientId === p.id ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-[12px] font-bold">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[13px] font-bold text-zinc-900 truncate">{p.name}</p>
                                                {p.unreadCount && p.unreadCount > 0 ? (
                                                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                        {p.unreadCount}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-medium truncate">#{p.id}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-[#FDFDFD]">
                        {activePatientId ? (
                            <>
                                <div className="p-4 border-b border-zinc-100 bg-white flex justify-between items-center">
                                    <div>
                                        <p className="text-[14px] font-bold text-zinc-900">{activePatients.find(p => p.id === activePatientId)?.name}</p>
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Active Conversation</p>
                                    </div>
                                </div>
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {currentChats.map((c, i) => (
                                        <div key={i} className={`flex ${c.isFromPatient ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-[13px] ${c.isFromPatient ? 'bg-zinc-100 text-zinc-800 rounded-tl-none' : 'bg-emerald-500 text-white rounded-tr-none'}`}>
                                                <p className="font-medium">{c.message}</p>
                                                <p className={`text-[9px] mt-1 opacity-60 ${c.isFromPatient ? 'text-zinc-500' : 'text-emerald-50'}`}>
                                                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-100 flex gap-2">
                                    <input
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Type your response..."
                                        className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:border-emerald-400 transition-colors"
                                    />
                                    <Button size="sm" type="submit" className="rounded-xl"><Send className="w-4 h-4" /></Button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                                <MessageSquare className="w-12 h-12 mb-3 opacity-10" />
                                <p className="text-[13px] font-medium">Select a patient to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // For Patient, show a floating chat
    if (user?.role === 'Receptionist') return null;

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-500/20 flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-95 z-[999]"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-white border border-zinc-200 rounded-[24px] shadow-2xl overflow-hidden flex flex-col z-[999] animate-in slide-in-from-bottom-4 duration-300">
                    <div className="p-4 bg-emerald-500 text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Headset className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold leading-tight">Enquiry Desk</h3>
                            <p className="text-[11px] opacity-80 font-medium">Receptionist is online</p>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFDFD]">
                        {chats.length === 0 && (
                            <div className="py-10 text-center px-6">
                                <p className="text-[12px] text-zinc-500 leading-relaxed font-medium">Hello {user?.fullName?.split(' ')[0]}! 👋 <br/> How can we help you today?</p>
                            </div>
                        )}
                        {chats.map((c, i) => (
                            <div key={i} className={`flex ${c.isFromPatient ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] ${c.isFromPatient ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-zinc-100 text-zinc-800 rounded-tl-none'}`}>
                                    {!c.isFromPatient && <p className="text-[10px] font-bold text-emerald-600 mb-1">{c.receptionistName}</p>}
                                    <p className="font-medium leading-relaxed">{c.message}</p>
                                    <p className={`text-[9px] mt-1 opacity-60 ${c.isFromPatient ? 'text-emerald-50' : 'text-zinc-500'}`}>
                                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-100 flex gap-2 bg-white">
                        <input
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Ask something..."
                            className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:border-emerald-400 transition-colors"
                        />
                        <button type="submit" className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};
