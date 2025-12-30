"use client";

import Sidebar from "@/components/Sidebar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/motion-wrapper";
import { createRoom } from "@/lib/db/rooms";
import { getUserProfile } from "@/lib/db/users";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Users, Play, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RoomLobby() {
    const { user } = useAuth();
    const router = useRouter();
    const [joinId, setJoinId] = useState("");
    const [roomName, setRoomName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!user) return;
        setIsCreating(true);
        try {
            const profile = await getUserProfile(user.uid);
            const roomId = await createRoom(
                user.uid,
                profile?.name || user.displayName || "Host",
                roomName,
                profile?.photoURL || user.photoURL || "",
                profile?.bio || ""
            );
            router.push(`/rooms/${roomId}`);
        } catch (error) {
            console.error("Failed to create room", error);
            setIsCreating(false);
        }
    };

    const handleJoin = () => {
        if (joinId.trim()) {
            router.push(`/rooms/${joinId}`);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-[var(--sidebar-width)] p-4 md:p-8 bg-gradient-to-br from-[#121212] to-black min-h-screen flex items-center justify-center transition-all duration-300 pb-24 md:pb-8">
                <PageTransition className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Left: Create */}
                    <div className="flex flex-col gap-4 md:gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Focus Rooms</h1>
                            <p className="text-[#b3b3b3] text-sm">Work together. Stay accountable.</p>
                        </div>

                        <Card className="bg-[#181818] p-6 md:p-8 flex flex-col items-center text-center gap-4 md:gap-6 border border-[#333] hover:border-spotify-green/30 transition-colors">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                className="w-16 h-16 md:w-20 md:h-20 bg-spotify-green/20 rounded-full flex items-center justify-center text-spotify-green transition-transform"
                            >
                                <Plus size={32} className="md:w-10 md:h-10" />
                            </motion.div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold">Start a Session</h2>
                                <p className="text-[#b3b3b3] text-sm">Create a new room and invite friends.</p>
                            </div>
                            <Input
                                placeholder="Room Name (Optional)"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                className="bg-[#222] border-none text-center text-sm"
                            />
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                                <Button onClick={handleCreate} isLoading={isCreating} className="w-full py-3">
                                    Create Instant Room
                                </Button>
                            </motion.div>
                        </Card>
                    </div>

                    {/* Right: Join */}
                    <div className="flex flex-col justify-center gap-4 md:gap-6">
                        <Card className="bg-[#181818] p-6 md:p-8 flex flex-col gap-4 md:gap-6 border border-[#333]">
                            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                <Users size={24} /> Join Room
                            </h2>
                            <p className="text-[#b3b3b3] text-sm">Enter a Room ID to join an ongoing session.</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    placeholder="Room ID..."
                                    value={joinId}
                                    onChange={(e) => setJoinId(e.target.value)}
                                    className="bg-[#222] border-none text-sm"
                                />
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button onClick={handleJoin} variant="secondary" className="w-full sm:w-auto">Join</Button>
                                </motion.div>
                            </div>
                        </Card>
                    </div>
                </PageTransition>
            </main>
        </div>
    );
}
