"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { getUserProfile, UserProfile, getAllUsers } from "@/lib/db/users";
import { listenToFriendships, Friendship, createFriendship } from "@/lib/db/friends";
import { Flame, Plus, UserPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, UserProfile>>({});
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      getUserProfile(user.uid).then(p => {
        setProfile(p);
        setLoadingConfig(false);
      });

      const unsub = listenToFriendships(user.uid, (data) => {
        setFriendships(data);
        // Fetch profiles for each friend
        data.forEach(f => {
          const otherId = f.members.find(id => id !== user.uid);
          if (otherId && !friendProfiles[otherId]) {
            getUserProfile(otherId).then(p => {
              if (p) {
                setFriendProfiles(prev => ({ ...prev, [otherId]: p }));
              }
            });
          }
        });
      });
      return () => unsub();
    }
  }, [user, isLoading, router]);

  /* New State for Directory Modal */
  const [showDirectory, setShowDirectory] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<UserProfile[]>([]);

  const handleOpenDirectory = async () => {
    setShowDirectory(true);
    const users = await getAllUsers();
    // Filter out self and existing friends
    const existingFriendIds = new Set(friendships.flatMap(f => f.members));
    const available = users.filter(u => u.uid !== user?.uid && !existingFriendIds.has(u.uid));
    setDirectoryUsers(available);
  };

  const handleStartStreak = async (targetUser: UserProfile) => {
    if (!user || !profile) return;
    try {
      await createFriendship(
        user.uid, { name: profile.name, photo: profile.photoURL || "" },
        targetUser.uid, { name: targetUser.name, photo: targetUser.photoURL || "" }
      );
      setShowDirectory(false);
    } catch (err) {
      console.error(err);
      alert("Failed to start streak");
    }
  };

  // The original handleAddFriend is replaced by handleOpenDirectory
  const handleAddFriend = handleOpenDirectory;

  if (isLoading || loadingConfig) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
          Initializing...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      <main className="ml-[var(--sidebar-width)] p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
        <PageTransition>
          {/* Header */}
          <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{greeting()}</h1>
              <p className="text-[#b3b3b3] text-sm md:text-base">Who are we grinding with today?</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenDirectory}
              className="flex items-center justify-center gap-2 bg-[#222] hover:bg-[#333] px-6 py-3 md:px-4 md:py-2 rounded-full transition-colors font-bold text-sm"
            >
              <UserPlus size={16} />
              Add Streak Friend
            </motion.button>
          </header>

          {/* Friend Streaks Grid */}
          <section>
            <h2 className="text-xl font-bold mb-6">Active Streaks</h2>

            {friendships.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-dashed border-[#333] rounded-xl p-8 md:p-12 text-center text-[#777]"
              >
                <p className="mb-4">No active streaks yet.</p>
                <button onClick={handleOpenDirectory} className="text-spotify-green font-bold hover:underline">Start one now</button>
              </motion.div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {friendships.map(friendship => {
                  const otherId = friendship.members.find(id => id !== user.uid) || "";
                  const otherData = friendship.memberData[otherId];
                  const liveP = friendProfiles[otherId];

                  return (
                    <StaggerItem key={friendship.id}>
                      <Card hoverEffect className="bg-[#181818] p-4 md:p-6 flex items-center gap-4 md:gap-6 group relative overflow-hidden h-full">
                        {/* PFP Link */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            router.push(`/profile?uid=${otherId}`);
                          }}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#333] flex-shrink-0 border-2 border-transparent hover:border-spotify-green transition-all overflow-hidden cursor-pointer z-10"
                        >
                          {(liveP?.photoURL || otherData?.photo) ? (
                            <img src={liveP?.photoURL || otherData?.photo} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blue-500 flex items-center justify-center font-bold text-xl">
                              {(liveP?.name || otherData?.name)?.[0]}
                            </div>
                          )}
                        </motion.div>

                        {/* Info / Streak Page Link */}
                        <div
                          className="flex-1 cursor-pointer z-10"
                          onClick={() => router.push(`/streak/${friendship.id}`)}
                        >
                          <h3 className="font-bold text-base md:text-lg mb-1 group-hover:text-spotify-green transition-colors line-clamp-1">{liveP?.name || otherData?.name || "Unknown Friend"}</h3>
                          <div className="flex items-center gap-2 text-[#b3b3b3] text-xs md:text-sm font-bold">
                            <Flame size={14} className={friendship.streakCount > 0 ? "text-orange-500" : "text-gray-600"} fill={friendship.streakCount > 0 ? "currentColor" : "none"} />
                            <span className={clsx(friendship.streakCount > 0 && "text-white")}>{friendship.streakCount} Days</span>
                          </div>
                        </div>

                        {/* Social Overlay Hint */}
                        <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                          <Flame size={100} />
                        </div>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            )}
          </section>
        </PageTransition>

        {/* Directory Modal */}
        <AnimatePresence>
          {showDirectory && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#181818] border border-[#333] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-[#333] flex items-center justify-between">
                  <h2 className="text-xl font-bold">Start a Streak</h2>
                  <button onClick={() => setShowDirectory(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="text-[#b3b3b3] hover:text-white" /></button>
                </div>
                <div className="overflow-y-auto p-4 flex-1 space-y-2 custom-scrollbar">
                  {directoryUsers.length === 0 ? (
                    <div className="text-center text-[#777] py-8">No other users found. Invite them!</div>
                  ) : (
                    directoryUsers.map((u, i) => (
                      <motion.div
                        key={u.uid}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 hover:bg-[#222] rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#333] overflow-hidden border border-transparent group-hover:border-spotify-green transition-colors">
                            {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : (
                              <div className="w-full h-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                {u.name[0]}
                              </div>
                            )}
                          </div>
                          <span className="font-bold">{u.name}</span>
                        </div>
                        <button
                          onClick={() => handleStartStreak(u)}
                          className="bg-spotify-green text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-spotify-green/20"
                        >
                          Add
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
