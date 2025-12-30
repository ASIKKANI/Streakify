"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { searchUsers, sendFriendRequest, getFriendRequests, acceptFriendRequest, getFriendsList, FriendRequest } from "@/lib/db/social";
import { UserProfile, getUserProfile } from "@/lib/db/users";
import { Search, UserPlus, Users, Check } from "lucide-react";
import Input from "@/components/ui/Input";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CommunityPage() {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (user) {
            getUserProfile(user.uid).then(setCurrentUserProfile);
            refreshData();
        }
    }, [user]);

    const refreshData = () => {
        if (!user) return;
        getFriendRequests(user.uid).then(setRequests);
        getFriendsList(user.uid).then(setFriends);
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        const results = await searchUsers(query);
        // Filter out self and existing friends (optional refinement)
        setSearchResults(results.filter(u => u.uid !== user?.uid));
    };

    const handleSendRequest = async (targetUserId: string) => {
        if (!currentUserProfile) return;
        await sendFriendRequest(currentUserProfile, targetUserId);
        alert("Request sent!");
        // clear status locally to prevent spam?
    };

    const handleAccept = async (req: FriendRequest) => {
        await acceptFriendRequest(req.id, req.fromId, req.toId);
        refreshData();
    };

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-[var(--sidebar-width)] p-4 md:p-8 bg-gradient-to-br from-[#121212] to-black min-h-screen pb-24 md:pb-8 transition-all duration-300">
                <PageTransition className="max-w-5xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Community</h1>

                    <StaggerContainer>
                        {/* Friend Requests */}
                        {requests.length > 0 && (
                            <StaggerItem>
                                <section className="mb-12">
                                    <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                                        <UserPlus className="text-spotify-green" size={20} /> Pending Requests
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {requests.map(req => (
                                            <Card key={req.id} className="flex items-center justify-between p-4 bg-[#202020] border border-white/5 hover:border-spotify-green/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden ring-1 ring-white/10">
                                                        {req.fromPhoto && <img src={req.fromPhoto} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="font-bold text-sm">{req.fromName}</span>
                                                </div>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button onClick={() => handleAccept(req)} className="w-auto h-8 px-4 text-xs font-bold">
                                                        Accept
                                                    </Button>
                                                </motion.div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            </StaggerItem>
                        )}

                        {/* Find Friends */}
                        <StaggerItem>
                            <section className="mb-12">
                                <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Search className="text-[#b3b3b3]" size={20} /> Find Friends
                                </h2>
                                <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-xl">
                                    <Input
                                        placeholder="Search by username..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="bg-[#202020] border-none flex-1"
                                    />
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button onClick={handleSearch} className="w-full sm:w-28 font-bold">Search</Button>
                                    </motion.div>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {searchResults.map(result => (
                                            <Card key={result.uid} className="flex items-center justify-between p-4 bg-[#181818] hover:bg-[#202020] border border-[#333] transition-all group">
                                                <Link href={`/profile?uid=${result.uid}`} className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 group-hover:ring-2 ring-spotify-green transition-all overflow-hidden border border-white/5">
                                                        {result.photoURL ? <img src={result.photoURL} className="w-full h-full object-cover" /> : result.username?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="font-bold text-sm truncate group-hover:text-spotify-green transition-colors">{result.name}</p>
                                                        <p className="text-[10px] md:text-xs text-[#b3b3b3] truncate">@{result.username}</p>
                                                    </div>
                                                </Link>
                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                    <Button
                                                        variant="secondary"
                                                        className="w-auto h-8 px-3 text-xs font-bold rounded-full border-white/10 hover:border-spotify-green hover:text-spotify-green"
                                                        onClick={() => handleSendRequest(result.uid)}
                                                    >
                                                        Add
                                                    </Button>
                                                </motion.div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </StaggerItem>

                        {/* My Friends */}
                        <StaggerItem>
                            <section>
                                <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Users className="text-[#b3b3b3]" size={20} /> My Circle
                                </h2>
                                {friends.length === 0 ? (
                                    <div className="p-12 text-center rounded-xl bg-[#181818] border border-dashed border-[#333]">
                                        <p className="text-[#b3b3b3] text-sm">Your circle is empty. Start by finding someone!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {friends.map(friend => (
                                            <Link href={`/profile?uid=${friend.uid}`} key={friend.uid}>
                                                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                                                    <Card className="flex items-center gap-4 p-4 bg-[#181818] hover:bg-[#202020] border border-[#333] cursor-pointer transition-colors group">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-lg ring-1 ring-white/10 overflow-hidden group-hover:ring-2 ring-spotify-green transition-all">
                                                            {friend.photoURL ? <img src={friend.photoURL} className="w-full h-full object-cover" /> : friend.username?.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="font-bold text-sm md:text-base group-hover:text-spotify-green transition-colors truncate">{friend.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] md:text-xs text-[#b3b3b3]">{friend.streakCount} 🔥</span>
                                                                <span className="text-[10px] md:text-xs text-[#b3b3b3] px-2 py-0.5 rounded-full bg-white/5">{friend.productivityScore} pts</span>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </StaggerItem>
                    </StaggerContainer>
                </PageTransition>
            </main>
        </div>
    );
}
