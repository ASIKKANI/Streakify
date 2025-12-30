"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Room, listenToRoom, joinRoom, updateRoomStatus, sendMessage, listenToMessages, Message, deleteRoom, addRoomTask, listenToRoomTasks, toggleRoomTask, deleteRoomTask, RoomTask, updateMemberStatus, leaveRoom, sendSystemMessage } from "@/lib/db/rooms";
import { getUserProfile, UserProfile } from "@/lib/db/users";
import { PageTransition } from "@/components/ui/motion-wrapper";
import { db } from "@/lib/firebase";
import { getDoc, doc } from "firebase/firestore";
import { Play, Pause, RotateCcw, Copy, Check, Send, Users, MessageSquare, Menu, X, User as UserIcon, Trash2, ListTodo, Plus, Circle, CheckCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";

export default function LiveRoomPage() {
    const { roomId } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [room, setRoom] = useState<Room | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [tasks, setTasks] = useState<RoomTask[]>([]);
    const [newTask, setNewTask] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [statusInput, setStatusInput] = useState("");
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'tasks'>('chat');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userNameRef = useRef(user?.displayName || "Guest");

    // Initial Join & Listeners
    useEffect(() => {
        if (!user || !roomId) return;

        const initRoom = async () => {
            // Fetch latest profile to get Bio/Photo
            const profile = await getUserProfile(user.uid);
            // Update ref for immediate use in chat without re-render
            const name = profile?.name || user.displayName || "Guest";
            userNameRef.current = name;

            await joinRoom(
                roomId as string,
                user.uid,
                name,
                profile?.photoURL || user.photoURL || "",
                profile?.bio || ""
            );

            // Fetch room name for the message
            const roomSnap = await getDoc(doc(db, "rooms", roomId as string));
            const roomData = roomSnap.data();
            const rName = roomData?.name || "the room";

            await sendSystemMessage(roomId as string, `${name} joined ${rName}`);
        };

        initRoom().catch(console.error);

        const unsubRoom = listenToRoom(roomId as string, (updatedRoom) => {
            if (!updatedRoom || (updatedRoom as any).active === false) {
                // Room deleted
                router.push("/rooms");
                return;
            }
            setRoom(updatedRoom);
        });
        const unsubMsgs = listenToMessages(roomId as string, setMessages);
        const unsubTasks = listenToRoomTasks(roomId as string, setTasks);

        return () => {
            unsubRoom();
            unsubMsgs();
            unsubTasks();
        };
    }, [user, roomId, router]);

    // Timer Logic
    useEffect(() => {
        if (!room) return;

        const tick = () => {
            if (room.status === 'idle') {
                setTimeLeft(room.duration);
                return;
            }

            if (room.startTime) {
                const now = Date.now();
                const start = room.startTime.toMillis();
                const elapsedSeconds = Math.floor((now - start) / 1000);
                const remaining = Math.max(0, room.duration - elapsedSeconds);
                setTimeLeft(remaining);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [room]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeTab]);

    if (!room) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="animate-pulse">Loading Room...</div>
        </div>
    );

    const isHost = user?.uid === room.hostId;
    const progress = ((room.duration - timeLeft) / room.duration) * 100;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const copyId = () => {
        navigator.clipboard.writeText(room.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user) return;
        try {
            await sendMessage(
                room.id,
                user.uid,
                userNameRef.current,
                newMessage.trim()
            );
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleLeaveRoom = async () => {
        if (!user || !roomId) return;
        try {
            await sendSystemMessage(roomId as string, `${userNameRef.current} left the room`);
            await leaveRoom(roomId as string, user.uid);
            router.push("/rooms");
        } catch (error) {
            console.error("Failed to leave room", error);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.trim() || !user) return;
        try {
            await addRoomTask(room.id, newTask.trim(), user.uid, userNameRef.current);
            setNewTask("");
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const handleUpdateStatus = async () => {
        if (!user || !roomId) return;
        try {
            await updateMemberStatus(roomId as string, user.uid, statusInput.trim());
            setIsEditingStatus(false);
            setStatusInput("");
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const toggleTimer = () => {
        if (room.status === 'idle') updateRoomStatus(room.id, 'focus', room.duration);
        else updateRoomStatus(room.id, 'idle', timeLeft);
    };

    const resetTimer = () => updateRoomStatus(room.id, 'idle', 25 * 60);

    const handleEndSession = async () => {
        if (confirm("Are you sure you want to end this session for everyone?")) {
            await deleteRoom(room.id);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row overflow-hidden">
            {/* Desktop Sidebar (Left Navigation) */}
            <div className="hidden md:block w-[var(--sidebar-width)] flex-shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Header - More polished */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#050505] border-b border-white/5 z-50 sticky top-0 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-spotify-green flex items-center justify-center font-bold text-black text-xs">S</div>
                    <span className="font-black text-lg tracking-tight">Focus Room</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Main Content Grid */}
            <main className="flex-1 flex flex-col md:flex-row h-screen md:h-screen relative overflow-hidden transition-all duration-300 ml-0 md:ml-[var(--sidebar-width)]">

                {/* Left: Timer & Focus Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#181818] to-black relative">
                    <div className="absolute top-6 left-6 flex flex-col gap-1 z-10">
                        {room.name && <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{room.name}</h2>}
                        <div className="flex items-center gap-3 text-[#b3b3b3] text-sm hover:text-white transition-colors group cursor-pointer" onClick={copyId}>
                            <span className="font-mono opacity-70">ID: {room.id}</span>
                            <div className="p-1.5 rounded-md bg-[#222] group-hover:bg-[#333] transition-colors">
                                {copied ? <Check size={16} className="text-spotify-green" /> : <Copy size={16} />}
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-3">
                        {isHost ? (
                            <Button onClick={handleEndSession} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 text-xs font-bold gap-2 rounded-lg">
                                <Trash2 size={14} /> End Session
                            </Button>
                        ) : (
                            <Button onClick={handleLeaveRoom} className="bg-white/10 text-white hover:bg-red-500 hover:text-white px-3 py-2 text-xs font-bold gap-2 rounded-lg border border-white/10">
                                <LogOut size={14} /> Leave Room
                            </Button>
                        )}

                        {/* Activity Bubbles (Discord Style) */}
                        <div className="flex flex-col gap-2 pointer-events-none">
                            <AnimatePresence>
                                {room.members.filter(m => m.currentTask && m.uid !== user?.uid).map((member) => (
                                    <motion.div
                                        key={member.uid}
                                        initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                        className="flex items-center gap-2 bg-[#121212]/80 backdrop-blur-md border border-[#333] p-1.5 pr-4 rounded-full shadow-2xl"
                                    >
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-spotify-green/50">
                                            {member.photo ? (
                                                <img src={member.photo} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-spotify-green flex items-center justify-center text-black font-bold text-xs uppercase">
                                                    {member.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-[#b3b3b3] font-bold leading-tight">{member.name}</span>
                                            <span className="text-xs text-white truncate max-w-[120px] leading-tight">{member.currentTask}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Timer Visualization */}
                    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center mb-8">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" stroke="#222" strokeWidth="8" fill="none" />
                            <motion.circle
                                cx="50%" cy="50%" r="45%"
                                stroke={room.status === 'focus' ? "#1DB954" : "#ff9900"}
                                strokeWidth="8"
                                fill="none"
                                initial={{ pathLength: 1 }}
                                animate={{ pathLength: 1 - progress / 100 }}
                                transition={{ duration: 1, ease: "linear" }}
                                strokeLinecap="round"
                                style={{ pathLength: 1 - progress / 100 }} // Fallback
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-6xl md:text-8xl font-black tabular-nums tracking-tighter">
                                {formatTime(timeLeft)}
                            </span>
                            <span className={`text-sm tracking-widest uppercase font-bold mt-2 ${room.status === 'focus' ? 'text-spotify-green' : 'text-[#b3b3b3]'}`}>
                                {room.status === 'idle' ? 'Ready to Focus' : room.status}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-6">
                        {isHost ? (
                            <div className="flex gap-4">
                                <Button
                                    onClick={toggleTimer}
                                    className={clsx(
                                        "w-40 h-14 text-lg gap-3 transition-transform active:scale-95",
                                        room.status === 'focus' ? "bg-white text-black hover:bg-gray-200" : "bg-spotify-green text-black hover:bg-green-400"
                                    )}
                                >
                                    {room.status === 'focus' ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                                    {room.status === 'focus' ? "Pause" : "Start"}
                                </Button>
                                <Button onClick={resetTimer} className="h-14 w-14 rounded-full bg-[#333] hover:bg-white hover:text-black border border-[#444] flex items-center justify-center transition-colors">
                                    <RotateCcw size={20} />
                                </Button>
                            </div>
                        ) : (
                            <div className="text-[#b3b3b3] animate-pulse">Waiting for host to control timer...</div>
                        )}

                        {/* My Status Editor */}
                        <div className="relative group">
                            <AnimatePresence mode="wait">
                                {isEditingStatus ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="flex items-center gap-2 bg-[#121212] border border-[#333] p-1 rounded-full pr-2"
                                    >
                                        <Input
                                            autoFocus
                                            placeholder="What are you doing?"
                                            className="h-8 bg-transparent border-none text-xs w-48 focus:ring-0"
                                            value={statusInput}
                                            onChange={(e) => setStatusInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateStatus()}
                                        />
                                        <button onClick={handleUpdateStatus} className="p-1 hover:text-spotify-green transition-colors">
                                            <CheckCircle size={18} />
                                        </button>
                                        <button onClick={() => setIsEditingStatus(false)} className="p-1 hover:text-red-500 transition-colors">
                                            <X size={18} />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        onClick={() => {
                                            setStatusInput(room.members.find(m => m.uid === user?.uid)?.currentTask || "");
                                            setIsEditingStatus(true);
                                        }}
                                        className="flex items-center gap-3 bg-[#181818] hover:bg-[#222] border border-[#333] p-2 px-4 rounded-full cursor-pointer transition-all group/status"
                                    >
                                        <div className="w-3 h-3 rounded-full bg-spotify-green animate-pulse" />
                                        <span className="text-sm text-[#b3b3b3] group-hover/status:text-white">
                                            {room.members.find(m => m.uid === user?.uid)?.currentTask || "Setting current task..."}
                                        </span>
                                        <Plus size={14} className="opacity-0 group-hover/status:opacity-100 transition-opacity" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar Panel (Chat & Members) */}
                <div className={clsx(
                    "md:w-96 bg-[#121212] border-l border-[#333] flex flex-col transition-all duration-300 absolute md:relative z-40 w-full h-full md:h-auto",
                    mobileMenuOpen ? "top-0" : "top-full md:top-0"
                )}>
                    {/* Tabs */}
                    <div className="flex border-b border-[#333]">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={clsx("flex-1 p-4 flex items-center justify-center gap-2 font-bold text-sm transition-colors", activeTab === 'chat' ? "text-spotify-green border-b-2 border-spotify-green" : "text-[#b3b3b3] hover:text-white")}
                        >
                            <MessageSquare size={16} /> Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={clsx("flex-1 p-4 flex items-center justify-center gap-2 font-bold text-sm transition-colors", activeTab === 'tasks' ? "text-spotify-green border-b-2 border-spotify-green" : "text-[#b3b3b3] hover:text-white")}
                        >
                            <ListTodo size={16} /> Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={clsx("flex-1 p-4 flex items-center justify-center gap-2 font-bold text-sm transition-colors", activeTab === 'members' ? "text-spotify-green border-b-2 border-spotify-green" : "text-[#b3b3b3] hover:text-white")}
                        >
                            <Users size={16} /> ({room.members.length})
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-[#333]">
                        {activeTab === 'chat' && (
                            <div className="flex flex-col gap-4 min-h-0">
                                {messages.length === 0 && (
                                    <div className="text-center text-[#555] mt-10 text-sm">No messages yet. Say hi!</div>
                                )}
                                {messages.map((msg) => {
                                    if (msg.isSystem) {
                                        return (
                                            <div key={msg.id} className="flex justify-center my-2">
                                                <span className="bg-[#181818] text-[#555] text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter font-bold border border-[#222]">
                                                    {msg.text}
                                                </span>
                                            </div>
                                        );
                                    }

                                    const senderMember = room.members.find(m => m.uid === msg.senderId);
                                    return (
                                        <div key={msg.id} className={clsx("flex flex-col max-w-[85%]", msg.senderId === user?.uid ? "self-end items-end" : "self-start items-start")}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {msg.senderId !== user?.uid && (
                                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-[#333] flex-shrink-0">
                                                        {senderMember?.photo ? (
                                                            <img src={senderMember.photo} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#333] flex items-center justify-center text-[8px] font-bold">
                                                                {msg.senderName[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <Link
                                                    href={`/profile?uid=${msg.senderId}`}
                                                    className="text-[10px] uppercase font-bold text-[#777] hover:text-white hover:underline transition-colors"
                                                >
                                                    {msg.senderName}
                                                </Link>
                                                <span className="text-[10px] text-[#444]">{msg.createdAt ? new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                            </div>
                                            <div className={clsx(
                                                "p-3 rounded-2xl text-sm leading-relaxed",
                                                msg.senderId === user?.uid ? "bg-spotify-green text-black rounded-tr-none" : "bg-[#2a2a2a] text-white rounded-tl-none"
                                            )}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="flex flex-col gap-2">
                                {room.members.map((member, i) => (
                                    <Link href={`/profile?uid=${member.uid}`} key={i} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-[#222] transition-colors relative">
                                        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center overflow-hidden border border-[#444]">
                                            {member.photo ? (
                                                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={20} className="text-[#888]" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm group-hover:text-spotify-green transition-colors">{member.name}</div>
                                            {member.uid === room.hostId && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Host</span>}
                                        </div>

                                        {/* Bio Hover Card */}
                                        {member.bio && (
                                            <div className="absolute left-0 bottom-full mb-2 w-full p-3 bg-[#181818] border border-[#333] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                                <p className="text-xs text-[#b3b3b3] italic">"{member.bio}"</p>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {activeTab === 'tasks' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={newTask}
                                        onChange={(e) => setNewTask(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                        placeholder="Add a shared task..."
                                        className="bg-[#222] border-none text-sm h-10"
                                    />
                                    <Button onClick={handleAddTask} className="w-10 h-10 px-0 flex items-center justify-center bg-[#333] hover:bg-white hover:text-black">
                                        <Plus size={18} />
                                    </Button>
                                </div>

                                {tasks.map((task) => (
                                    <div key={task.id} className="flex items-start gap-3 p-3 rounded bg-[#222] hover:bg-[#2a2a2a] group">
                                        <button onClick={() => toggleRoomTask(room.id, task.id, !task.completed)} className="mt-1">
                                            {task.completed ? <CheckCircle size={18} className="text-spotify-green" /> : <Circle size={18} className="text-gray-500" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx("text-sm leading-tight break-words", task.completed && "line-through text-[#666]")}>{task.text}</p>
                                            <span className="text-[10px] text-[#555] mt-1 block">Added by {task.addedByName}</span>
                                        </div>
                                        <button onClick={() => deleteRoomTask(room.id, task.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Input (Only show on Chat tab) */}
                    {activeTab === 'chat' && (
                        <div className="p-4 border-t border-[#333] bg-[#000]">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="bg-[#222] border-none text-sm h-10"
                                />
                                <Button onClick={handleSendMessage} className="w-12 h-10 px-0 flex items-center justify-center bg-[#333] hover:bg-white hover:text-black">
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
