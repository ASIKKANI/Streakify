"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Box, User, LogOut, Users, Trophy, PlusCircle, Trash2, MoreHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { listenToUserRooms, Room, leaveRoom } from "@/lib/db/rooms";
import { getUserProfile, UserProfile } from "@/lib/db/users";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (user) {
            const unsubscribe = listenToUserRooms(user.uid, setMyRooms);
            getUserProfile(user.uid).then(setMyProfile);
            return () => unsubscribe();
        } else {
            setMyRooms([]);
            setMyProfile(null);
        }
    }, [user]);

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Tasks", href: "/tasks", icon: ListTodo },
        { name: "Rooms", href: "/rooms", icon: Users },
        { name: "Profile", href: "/profile", icon: User },
    ];

    if (isMobile) {
        return (
            <nav className="fixed bottom-0 left-0 right-0 bg-[#050505]/80 backdrop-blur-lg border-t border-white/10 z-50 px-4 py-2 flex justify-around items-center h-[var(--bottom-nav-height)]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center gap-1 transition-all relative px-3 py-1",
                                isActive ? "text-spotify-green" : "text-[#b3b3b3] hover:text-white"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active"
                                    className="absolute -top-2 left-0 right-0 h-1 bg-spotify-green rounded-full shadow-[0_-4px_10px_rgba(29,185,84,0.5)]"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={clsx("transition-transform", isActive && "scale-110")} />
                            <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        );
    }

    return (
        <aside className="w-[var(--sidebar-width)] bg-black flex flex-col h-screen fixed left-0 top-0 p-6 z-40">
            <div className="mb-8 px-2">
                <Link href="/">
                    <h1 className="text-2xl font-bold tracking-tighter text-white hover:text-spotify-green transition-colors cursor-pointer">
                        Streakify
                    </h1>
                </Link>
            </div>

            <nav className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-4 text-sm font-bold transition-all group",
                                    isActive ? "text-white" : "text-[#b3b3b3] hover:text-white"
                                )}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={clsx("p-1 rounded-md", isActive && "bg-white/5")}
                                >
                                    <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                                </motion.div>
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                <div className="bg-[#121212] rounded-lg p-4 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer">
                        <span className="font-bold text-sm">YOUR ROOMS</span>
                        <motion.button whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                            <PlusCircle size={20} />
                        </motion.button>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {myRooms.length === 0 ? (
                            <div className="text-sm text-[#b3b3b3] p-2 italic">
                                <p>No rooms joined yet.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {myRooms.map(room => (
                                    <motion.div
                                        key={room.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        layout
                                        className="relative group/item"
                                    >
                                        <Link
                                            href={`/rooms/${room.id}`}
                                            className="block p-3 rounded bg-[#222] hover:bg-[#333] transition-colors group pr-8"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm truncate w-24" title={room.name || `${room.hostName}'s Room`}>{room.name || `${room.hostName}'s Room`}</span>
                                                <span className={clsx("w-2 h-2 rounded-full", room.status === 'focus' ? "bg-green-500 animate-pulse" : "bg-orange-500")}></span>
                                            </div>
                                            <div className="text-xs text-[#777] group-hover:text-[#999]">
                                                {room.members.length} members
                                            </div>
                                        </Link>
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition-colors p-1 opacity-0 group-hover/item:opacity-100"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm("Remove this room from your list?")) {
                                                    leaveRoom(room.id, user!.uid);
                                                }
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 px-2">
                    <Link
                        href="/community"
                        className={clsx(
                            "flex items-center gap-4 transition-colors font-bold text-sm",
                            pathname === "/community" ? "text-white" : "text-[#b3b3b3] hover:text-white"
                        )}
                    >
                        <Users size={20} />
                        Community
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={clsx(
                            "flex items-center gap-4 transition-colors font-bold text-sm",
                            pathname === "/leaderboard" ? "text-white" : "text-[#b3b3b3] hover:text-white"
                        )}
                    >
                        <Trophy size={20} />
                        Leaderboard
                    </Link>
                </div>
            </nav>

            <div className="mt-auto pt-6 border-t border-[#121212] flex flex-col gap-4">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 text-sm font-bold text-[#b3b3b3] hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-[#121212]"
                >
                    <LogOut size={20} />
                    Log out
                </button>

                {user && (
                    <Link
                        href="/profile"
                        className={clsx(
                            "flex items-center gap-3 p-3 rounded-xl transition-all group",
                            pathname === "/profile" ? "bg-[#181818] ring-1 ring-[#333]" : "hover:bg-[#121212]"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-spotify-green/10 flex-shrink-0 overflow-hidden border border-[#333] group-hover:border-spotify-green transition-colors">
                            {(myProfile?.photoURL || user.photoURL) ? (
                                <img src={myProfile?.photoURL || user.photoURL || ""} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-spotify-green flex items-center justify-center text-black font-bold">
                                    {(myProfile?.name || user.displayName || "U")[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{myProfile?.name || user.displayName || "User"}</p>
                            <p className="text-[10px] text-[#b3b3b3] font-medium">View Profile</p>
                        </div>
                    </Link>
                )}
            </div>
        </aside>
    );
}
