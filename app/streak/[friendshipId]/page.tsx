"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getFriendship, Friendship } from "@/lib/db/friends";
import { getUserProfile, UserProfile } from "@/lib/db/users";
import { DailyLog, createDailyLog } from "@/lib/db/logs";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StreakCalendar from "@/components/StreakCalendar";
import Button from "@/components/ui/Button";
import { useStorage } from "@/hooks/useStorage";
import { UploadCloud, ArrowLeft, Flame } from "lucide-react";
import LogDetailModal from "@/components/LogDetailModal";

export default function FriendStreakPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { uploadFile, isUploading } = useStorage(); // Use existing hook

    const friendshipId = params.friendshipId as string;

    const [friendship, setFriendship] = useState<Friendship | null>(null);
    const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
    const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);

    useEffect(() => {
        if (!friendshipId || !user) return;

        // 1. Fetch Friendship & Profiles
        getFriendship(friendshipId).then(async (fs) => {
            setFriendship(fs);
            if (fs) {
                const otherId = fs.members.find(id => id !== user.uid);
                if (otherId) {
                    getUserProfile(otherId).then(setOtherUserProfile);
                }
            }
        });

        getUserProfile(user.uid).then(setMyProfile);

        // 2. Real-time Listen to Logs
        const logsRef = collection(db, "dailyLogs");
        const q = query(logsRef, where("friendshipId", "==", friendshipId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as DailyLog[];
            // Client-side sort
            data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
            setLogs(data);

            // Also update selectedLog if it's open, to show reaction changes real-time
            if (selectedLog) {
                const updated = data.find(l => l.id === selectedLog.id);
                if (updated) setSelectedLog(updated);
            }
        });

        return () => unsubscribe();
    }, [friendshipId, user, selectedLog?.id]); // Add selectedLog.id to dependency to ensure selectedLog updates? 
    // Actually, putting selectedLog in dependency might cause loop if we set it inside.
    // Better strategy: Use a separate useEffect or ref for selectedLog updating, OR just rely on the fact that if logs update, we can find the open one.
    // Let's refine the replacement to be stable.

    if (!friendship || !user) return <div className="min-h-screen bg-black text-white p-8">Loading...</div>;

    // Determine "Other User" (fallback to memberData if profile fetch pending)
    const otherUserId = friendship.members.find(id => id !== user.uid) || "";
    const otherUserStatic = friendship.memberData[otherUserId];
    const displayUser = otherUserProfile || {
        name: otherUserStatic?.name || "Friend",
        photoURL: otherUserStatic?.photo || "",
        uid: otherUserId
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <button onClick={() => router.push("/")} className="flex items-center gap-2 text-[#b3b3b3] hover:text-white mb-6">
                <ArrowLeft size={20} /> Back to Hub
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link
                    href={`/profile?uid=${displayUser.uid}`}
                    className="flex items-center gap-4 group cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full bg-[#333] overflow-hidden border-2 border-[#333] group-hover:border-spotify-green transition-colors">
                        {displayUser.photoURL ? (
                            <img src={displayUser.photoURL} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-purple-500 flex items-center justify-center font-bold text-xl">
                                {displayUser.name?.[0]}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold group-hover:text-spotify-green transition-colors">{displayUser.name}</h1>
                        <p className="text-[#b3b3b3] text-sm flex items-center gap-2">
                            <Flame size={14} className="text-orange-500" />
                            {friendship.streakCount} Day Streak
                        </p>
                    </div>
                </Link>

                {/* Upload Action */}
                <div className="relative">
                    <button
                        onClick={() => router.push(`/log/new?friendshipId=${friendshipId}`)}
                        className="bg-spotify-green text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <UploadCloud size={20} />
                        Log Today's Proof
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Calendar & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <StreakCalendar logs={logs} />

                    <div className="bg-[#181818] p-6 rounded-xl border border-[#333]">
                        <h3 className="font-bold mb-4">Streak Stats</h3>
                        <div className="flex justify-between text-sm text-[#b3b3b3] border-b border-[#333] pb-2 mb-2">
                            <span>Total Logs</span>
                            <span className="text-white font-bold">{logs.length}</span>
                        </div>
                        <div className="flex justify-between text-sm text-[#b3b3b3]">
                            <span>Started</span>
                            <span className="text-white font-bold">{friendship.createdAt ? new Date(friendship.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Feed */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">History</h2>

                    {logs.length === 0 ? (
                        <div className="bg-[#181818] p-8 rounded-xl border border-[#333] text-center flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
                                <Flame size={32} className="text-[#444]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No logs yet</h3>
                            <p className="text-[#b3b3b3] max-w-md italic mb-6">
                                "{["The only way to do great work is to love what you do.", "Success is the sum of small efforts, repeated day in and day out.", "Don't watch the clock; do what it does. Keep going.", "The secret of getting ahead is getting started."][Math.floor(Math.random() * 4)]}"
                            </p>
                            <Button
                                onClick={() => router.push(`/log/new?friendshipId=${friendshipId}`)}
                                variant="primary"
                            >
                                Start the Streak!
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map(log => {
                                const isMe = log.userId === user.uid;
                                // Use the fetched profile photo for 'other', fallback to static data
                                const avatarUrl = isMe
                                    ? (myProfile?.photoURL || user.photoURL || myProfile?.name?.[0] || user.displayName?.[0] || "?")
                                    : (otherUserProfile?.photoURL || otherUserStatic?.photo || otherUserStatic?.name?.[0] || "?");

                                return (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="bg-[#181818] p-4 rounded-xl flex flex-col gap-3 cursor-pointer hover:bg-[#222] transition-colors border border-transparent hover:border-[#333]"
                                    >
                                        {/* Header: Avatar + Name + Time */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-spotify-green/20 overflow-hidden flex items-center justify-center text-xs font-bold ring-2 ring-[#333]">
                                                    {avatarUrl && avatarUrl.length > 2 ? (
                                                        <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                                                    ) : (
                                                        <span className="text-spotify-green">{avatarUrl}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-white block leading-none">
                                                        {isMe ? "You" : (otherUserProfile?.name || otherUserStatic?.name)}
                                                    </span>
                                                    <span className="text-[10px] text-[#666]">
                                                        {new Date(log.timestamp?.seconds * 1000).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content: Image + Text */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-20 h-20 bg-[#222] rounded-lg overflow-hidden flex-shrink-0 border border-[#333]">
                                                {log.proofURL && <img src={log.proofURL} className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold mb-1 truncate">{log.title}</p>
                                                <p className="text-sm text-[#b3b3b3] line-clamp-2 leading-relaxed">{log.description}</p>
                                            </div>
                                        </div>

                                        {/* Footer: Reactions */}
                                        {log.reactions && Object.keys(log.reactions).length > 0 && (
                                            <div className="flex gap-1 mt-1 pl-24">
                                                <span className="bg-[#333] text-orange-500 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                    <Flame size={12} fill="currentColor" /> {Object.keys(log.reactions).length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <LogDetailModal
                log={selectedLog}
                onClose={() => setSelectedLog(null)}
                currentUserName={selectedLog?.userId === user.uid ? (myProfile?.name || "You") : (otherUserProfile?.name || otherUserStatic?.name || "Friend")}
            />
        </div>
    );
}

