"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/ui/Card";
import { User, Shield, Share2, MoreHorizontal, MessageSquare, Edit2, Trash2, Flame, Clock, Trophy, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProfile, UserProfile, updateUserProfile } from "@/lib/db/users";
import { DailyLog, getRecentLogs, deleteDailyLog } from "@/lib/db/logs";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useStorage } from "@/hooks/useStorage";
import StreakCalendar from "@/components/StreakCalendar";

import { useSearchParams } from "next/navigation";

export default function ProfilePage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const targetUid = searchParams.get("uid") || user?.uid;
    const { uploadFile, isUploading: isStorageUploading } = useStorage();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<DailyLog[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newBio, setNewBio] = useState("");
    const [isUploadingPfp, setIsUploadingPfp] = useState(false);

    const isOwnProfile = user?.uid === targetUid;

    useEffect(() => {
        if (targetUid) {
            // Fetch Profile
            getUserProfile(targetUid).then(p => {
                setProfile(p);
                if (p?.bio) setNewBio(p.bio);
            });

            // Fetch user specific logs
            const fetchUserLogs = async () => {
                const logsRef = collection(db, "dailyLogs");
                // Remove orderBy to avoid "Missing Index" error. Sort client-side.
                const q = query(logsRef, where("userId", "==", targetUid), limit(20));

                try {
                    const snapshot = await getDocs(q);
                    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DailyLog[];

                    // Client-side sort (Newest first)
                    logs.sort((a, b) => {
                        const tA = a.timestamp?.seconds || 0;
                        const tB = b.timestamp?.seconds || 0;
                        return tB - tA;
                    });

                    setHistory(logs);
                } catch (err) {
                    console.error("Error fetching logs:", err);
                }
            };
            fetchUserLogs();
        }
    }, [targetUid]);

    const handlePfpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !user) return;
        const file = e.target.files[0];

        setIsUploadingPfp(true);
        try {
            const downloadURL = await uploadFile(file, `profiles/${user.uid}`);
            await updateUserProfile(user.uid, { photoURL: downloadURL });
            setProfile(prev => prev ? { ...prev, photoURL: downloadURL } : null);
        } catch (error) {
            console.error("Failed to upload PFP", error);
            alert("Failed to upload profile picture");
        } finally {
            setIsUploadingPfp(false);
        }
    };

    const handleSaveBio = async () => {
        if (!user) return;
        try {
            await updateUserProfile(user.uid, { bio: newBio });
            setProfile(prev => prev ? { ...prev, bio: newBio } : null);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update bio", error);
        }
    };

    if (!user) return null;

    // Real stats
    const stats = [
        { label: "Current Streak", value: `${profile?.streakCount || 0} Days`, icon: Flame, color: "text-orange-500" },
        { label: "Focus Hours", value: "0h", icon: Clock, color: "text-blue-400" }, // Placeholder for now
        { label: "Total Score", value: `${profile?.productivityScore || 0}`, icon: Trophy, color: "text-yellow-400" },
    ];

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />

            <main className="flex-1 ml-[var(--sidebar-width)] bg-gradient-to-b from-[#404040] to-black min-h-screen pb-24 md:pb-0 transition-all duration-300">
                <PageTransition>
                    {/* Hero Section (Artist Header) */}
                    <div className="min-h-[400px] md:h-80 w-full relative p-6 md:p-8 flex items-end bg-gradient-to-b from-transparent to-black/60 pt-12">
                        <div className="flex flex-col md:flex-end md:flex-row items-center md:items-end gap-6 z-10 w-full text-center md:text-left">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative group"
                            >
                                <div className="w-40 h-40 md:w-52 md:h-52 rounded-full shadow-2xl bg-[#333] flex items-center justify-center border-4 border-[#121212] overflow-hidden relative">
                                    {(isUploadingPfp || isStorageUploading) ? (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : null}

                                    {profile?.photoURL || (isOwnProfile && user?.photoURL) ? (
                                        <img src={profile?.photoURL || user?.photoURL || ""} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={60} className="text-gray-400 md:w-20 md:h-20" />
                                    )}
                                </div>

                                {isOwnProfile && (
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full z-10">
                                        <Camera size={32} className="text-white drop-shadow-md" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePfpChange}
                                        />
                                    </label>
                                )}
                            </motion.div>

                            <div className="mb-4 w-full">
                                <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-spotify-green">Productivity Beast</span>
                                <h1 className="text-3xl md:text-6xl font-black tracking-tighter mb-4">{profile?.name || (isOwnProfile ? user?.displayName : "User")}</h1>

                                {/* Bio Section */}
                                <div className="mb-4 flex flex-col items-center md:items-start">
                                    {isEditing ? (
                                        <div className="flex gap-2 w-full max-w-md">
                                            <input
                                                value={newBio}
                                                onChange={(e) => setNewBio(e.target.value)}
                                                className="bg-[#222] text-white p-2 rounded border border-[#444] w-full text-sm"
                                                placeholder="Write a short bio..."
                                            />
                                            <button onClick={handleSaveBio} className="bg-spotify-green text-black font-bold px-4 py-2 rounded text-sm hover:scale-105 transition-transform">Save</button>
                                            <button onClick={() => setIsEditing(false)} className="text-[#b3b3b3] hover:text-white px-2 text-sm">Cancel</button>
                                        </div>
                                    ) : (
                                        <p className="text-base md:text-lg text-white/80 max-w-2xl italic flex items-center gap-2 group">
                                            "{profile?.bio || "No bio yet."}"
                                            {isOwnProfile && <motion.button whileHover={{ scale: 1.1 }} onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-xs text-spotify-green underline">Edit</motion.button>}
                                        </p>
                                    )}
                                </div>

                                <p className="text-[#b3b3b3] font-bold text-sm">
                                    {stats[0].value} Streak • {stats[2].value} Points
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-black/20 backdrop-blur-3xl p-8 min-h-[calc(100vh-320px)]">

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-4xl">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Card variant="glass" className="flex items-center gap-4 hover:bg-white/5 transition-colors p-4 md:p-6">
                                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                        <div>
                                            <p className="text-[#b3b3b3] text-[10px] md:text-xs font-bold uppercase">{stat.label}</p>
                                            <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Activity Heatmap */}
                        <div className="mb-12 max-w-4xl">
                            <h2 className="text-xl font-bold mb-6">Activity Heatmap</h2>
                            <StreakCalendar logs={history} />
                        </div>

                        {/* Recent Activity "Tracks" */}
                        <h2 className="text-2xl font-bold mb-6">Recent Proofs</h2>

                        {history.length === 0 ? (
                            <div className="text-[#b3b3b3]">No logs details yet.</div>
                        ) : (
                            <StaggerContainer className="flex flex-col gap-2 max-w-5xl">
                                {history.map((log, index) => (
                                    <StaggerItem key={log.id}>
                                        <div className="group flex items-center gap-4 p-4 rounded-md hover:bg-white/10 transition-colors cursor-pointer relative pr-20">
                                            <span className="text-[#b3b3b3] w-4 text-center">{index + 1}</span>
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#333] rounded overflow-hidden flex-shrink-0">
                                                {/* Tiny thumbnail */}
                                                {log.proofURL && <img src={log.proofURL} className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white group-hover:text-spotify-green transition-colors text-sm md:text-base truncate">{log.title}</h3>
                                                <p className="text-xs md:text-sm text-[#b3b3b3] line-clamp-1">{log.description}</p>
                                            </div>

                                            {isOwnProfile && (
                                                <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/log/${log.id}/edit`}
                                                        className="p-1.5 md:p-2 text-[#b3b3b3] hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                                        title="Edit Log"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (confirm("Delete this log?")) {
                                                                await deleteDailyLog(log.id!);
                                                                setHistory(prev => prev.filter(p => p.id !== log.id));
                                                            }
                                                        }}
                                                        className="p-1.5 md:p-2 text-[#b3b3b3] hover:text-red-500 hover:bg-white/10 rounded-full transition-colors"
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {!isOwnProfile && <span className="text-[#b3b3b3] text-[10px] md:text-sm font-bold ml-auto">Verified</span>}
                                        </div>
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>
                        )}
                    </div>
                </PageTransition>
            </main>
        </div>
    );
}
