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

    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // Increased threshold for broader tablet/mobile support
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
        { name: "Rooms", href: "/rooms", icon: Box },
        { name: "Community", href: "/community", icon: Users },
        { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
        { name: "Profile", href: "/profile", icon: User },
    ];

    if (isMobile) {
        // Only show top 4 + "More" on mobile bottom nav
        const mobileNavItems = [
            { name: "Home", href: "/", icon: Home },
            { name: "Tasks", href: "/tasks", icon: ListTodo },
            { name: "Community", href: "/community", icon: Users },
            { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
        ];

        return (
            <>
                <AnimatePresence>
                    {showMore && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowMore(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed bottom-[var(--bottom-nav-height)] left-0 right-0 bg-[#121212] border-t border-white/10 z-[70] rounded-t-3xl p-6 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                            >
                                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

                                <div className="flex-1 overflow-y-auto space-y-6 pb-20">
                                    {/* Profile in menu */}
                                    <Link
                                        href="/profile"
                                        onClick={() => setShowMore(false)}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5"
                                    >
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-spotify-green/20">
                                            {(myProfile?.photoURL || user?.photoURL) ? (
                                                <img src={myProfile?.photoURL || user?.photoURL || ""} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-spotify-green flex items-center justify-center text-black font-black text-xl">
                                                    {(myProfile?.name || user?.displayName || "U")[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-white">{myProfile?.name || user?.displayName || "User"}</h3>
                                            <p className="text-spotify-green text-sm font-bold uppercase tracking-widest">View Profile</p>
                                        </div>
                                    </Link>

                                    {/* Your Rooms */}
                                    <div>
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-4 pl-2">Your Focus Rooms</h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {myRooms.length === 0 ? (
                                                <p className="text-sm text-white/40 italic p-4 text-center bg-white/5 rounded-xl">No active rooms</p>
                                            ) : (
                                                myRooms.map(room => (
                                                    <Link
                                                        key={room.id}
                                                        href={`/rooms/${room.id}`}
                                                        onClick={() => setShowMore(false)}
                                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={clsx("w-2 h-2 rounded-full", room.status === 'focus' ? "bg-spotify-green shadow-[0_0_8px_rgba(29,185,84,0.6)]" : "bg-orange-500")} />
                                                            <span className="font-bold">{room.name || "Focus Session"}</span>
                                                        </div>
                                                        <span className="text-xs text-white/40 font-bold">{room.members.length} active</span>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link
                                            href="/rooms"
                                            onClick={() => setShowMore(false)}
                                            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-center"
                                        >
                                            <Box className="text-spotify-green" size={28} />
                                            <span className="font-bold text-sm">Join Rooms</span>
                                        </Link>
                                        <button
                                            onClick={() => signOut()}
                                            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-center"
                                        >
                                            <LogOut className="text-red-500" size={28} />
                                            <span className="font-bold text-sm text-red-500 uppercase tracking-widest italic">Log Out</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 z-[100] px-2 py-3 flex justify-around items-center h-[var(--bottom-nav-height)] safe-area-pb">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setShowMore(false)}
                                className={clsx(
                                    "flex flex-col items-center justify-center gap-1 transition-all relative px-2",
                                    isActive ? "text-spotify-green" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-spotify-green rounded-full shadow-[0_0_15px_rgba(29,185,84,0.8)]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                    {/* More button */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-1 transition-all px-2 relative",
                            showMore ? "text-spotify-green" : "text-white/40 hover:text-white"
                        )}
                    >
                        <MoreHorizontal size={24} strokeWidth={showMore ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
                        {showMore && (
                            <motion.div
                                layoutId="nav-glow"
                                className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-spotify-green rounded-full shadow-[0_0_15px_rgba(29,185,84,0.8)]"
                            />
                        )}
                    </button>
                </nav>
            </>
        );
    }

    return (
        <aside className="w-[var(--sidebar-width)] bg-black flex flex-col h-screen fixed left-0 top-0 p-6 z-40 border-r border-white/5">
            <div className="mb-10 px-2">
                <Link href="/">
                    <h1 className="text-3xl font-black tracking-tighter text-white hover:text-spotify-green transition-colors cursor-pointer italic">
                        STREAKIFY
                    </h1>
                </Link>
            </div>

            <nav className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-bold transition-all group",
                                    isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={clsx(isActive ? "text-spotify-green" : "text-white/40 shadow-sm")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                <div className="bg-white/5 rounded-2xl p-5 flex-1 flex flex-col overflow-hidden border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-black text-[11px] text-white/40 uppercase tracking-[0.2em]">Your Focus Rooms</span>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-spotify-green/20 p-1.5 rounded-lg text-spotify-green"
                        >
                            <PlusCircle size={18} strokeWidth={2.5} />
                        </motion.button>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {myRooms.length === 0 ? (
                            <div className="text-center py-10 px-4 group">
                                <Box className="w-12 h-12 mx-auto mb-4 text-white/5 group-hover:text-spotify-green/20 transition-colors" />
                                <p className="text-xs text-white/30 font-bold uppercase tracking-widest italic">Join a focus session to start crushing goals</p>
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
                                            className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group pr-10"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-sm truncate uppercase tracking-tight" title={room.name || `${room.hostName}'s Room`}>{room.name || `${room.hostName}'s Room`}</span>
                                                <div className={clsx("w-2 h-2 rounded-full", room.status === 'focus' ? "bg-spotify-green shadow-[0_0_8px_rgba(29,185,84,0.6)] animate-pulse" : "bg-orange-500")} />
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                                <Users size={12} />
                                                {room.members.length} members
                                            </div>
                                        </Link>
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-red-500 transition-colors p-2 opacity-0 group-hover/item:opacity-100"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm("Remove this room from your list?")) {
                                                    leaveRoom(room.id, user!.uid);
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
                {user && (
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/profile"
                            className={clsx(
                                "flex items-center gap-3 p-4 rounded-2xl transition-all group border border-transparent",
                                pathname === "/profile" ? "bg-white/10 border-white/10" : "hover:bg-white/5"
                            )}
                        >
                            <div className="w-12 h-12 rounded-full bg-spotify-green/10 flex-shrink-0 overflow-hidden border-2 border-white/5 group-hover:border-spotify-green transition-colors">
                                {(myProfile?.photoURL || user.photoURL) ? (
                                    <img src={myProfile?.photoURL || user.photoURL || ""} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-spotify-green flex items-center justify-center text-black font-black">
                                        {(myProfile?.name || user.displayName || "U")[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate tracking-tight uppercase italic">{myProfile?.name || user.displayName || "User"}</p>
                                <p className="text-[10px] text-spotify-green font-black uppercase tracking-widest">View Account</p>
                            </div>
                        </Link>

                        <button
                            onClick={() => signOut()}
                            className="flex items-center justify-center gap-2 p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-red-500 hover:bg-red-500/5 transition-all w-full border border-transparent hover:border-red-500/20 italic"
                        >
                            <LogOut size={16} />
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
