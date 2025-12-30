"use client";

import Sidebar from "@/components/Sidebar";
import Card from "@/components/ui/Card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { getGlobalLeaderboard } from "@/lib/db/leaderboard";
import { UserProfile } from "@/lib/db/users";
import { useEffect, useState } from "react";
import { Trophy, Medal, Crown } from "lucide-react";

export default function LeaderboardPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);

    useEffect(() => {
        getGlobalLeaderboard().then(setUsers);
    }, []);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="text-yellow-500" fill="currentColor" />;
            case 1: return <Medal className="text-gray-300" fill="currentColor" />;
            case 2: return <Medal className="text-orange-400" fill="currentColor" />;
            default: return <span className="font-bold text-[#b3b3b3] w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-[var(--sidebar-width)] p-4 md:p-8 bg-gradient-to-br from-[#121212] to-black min-h-screen pb-24 md:pb-8 transition-all duration-300">
                <PageTransition className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Trophy size={32} className="text-yellow-500 md:w-10 md:h-10" />
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold">Global Leaderboard</h1>
                            <p className="text-[#b3b3b3] text-sm md:text-base">Top streaks from around the world.</p>
                        </div>
                    </div>

                    <Card className="bg-[#181818] p-0 overflow-hidden border border-[#333]">
                        {/* Header Row - Hidden on mobile, shown on md+ */}
                        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-[#333] text-sm text-[#b3b3b3] font-bold uppercase">
                            <div className="col-span-1 text-center">Rank</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-6">User</div>
                            <div className="col-span-2 text-center">Streak</div>
                            <div className="col-span-2 text-center">Score</div>
                        </div>

                        <div className="p-2">
                            {users.length === 0 ? (
                                <div className="p-8 text-center text-[#b3b3b3]">Loading rankings...</div>
                            ) : (
                                <StaggerContainer>
                                    {users.map((user, index) => (
                                        <StaggerItem key={user.uid}>
                                            <div className={`grid grid-cols-12 gap-2 md:gap-4 items-center p-3 md:p-4 rounded-md hover:bg-white/5 transition-colors ${index < 3 ? 'bg-white/5 mb-2 border border-spotify-green/20' : 'mb-1'}`}>
                                                <div className="col-span-2 md:col-span-1 flex justify-center text-sm md:text-base">
                                                    {getRankIcon(index)}
                                                </div>
                                                <div className="col-span-2 md:col-span-1">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-xs ring-2 ring-transparent group-hover:ring-spotify-green overflow-hidden">
                                                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : (user.username?.[0] || user.name[0])}
                                                    </div>
                                                </div>
                                                <div className="col-span-5 md:col-span-6 font-bold truncate text-sm md:text-base pr-2">
                                                    {user.username || user.name}
                                                    {index === 0 && <span className="hidden sm:inline-block ml-2 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">CHAMPION</span>}
                                                </div>
                                                <div className="col-span-3 md:col-span-2 text-right md:text-center font-mono font-bold text-spotify-green text-sm md:text-base">
                                                    {user.streakCount} 🔥
                                                </div>
                                                <div className="hidden md:block col-span-2 text-center text-[#b3b3b3]">
                                                    {user.productivityScore}
                                                </div>
                                            </div>
                                        </StaggerItem>
                                    ))}
                                </StaggerContainer>
                            )}
                        </div>
                    </Card>
                </PageTransition>
            </main>
        </div>
    );
}
