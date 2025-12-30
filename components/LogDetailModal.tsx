"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Trash2, Edit2, Share2 } from "lucide-react";
import { DailyLog, toggleLogReaction, deleteDailyLog, updateDailyLog } from "@/lib/db/logs";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogDetailModalProps {
    log: DailyLog | null;
    onClose: () => void;
    currentUserName: string; // Name of the log owner ideally, but we might pass memberData lookup
}

export default function LogDetailModal({ log, onClose, currentUserName }: LogDetailModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isReacting, setIsReacting] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    if (!log) return null;

    const isOwner = user?.uid === log.userId;
    const reactions = log.reactions || {};
    const myReaction = user ? reactions[user.uid] : null;
    const reactionCount = Object.keys(reactions).length;

    const handleReaction = async () => {
        if (!user || !log.id) return;
        setIsReacting(true);
        // Optimistic UI could go here, but for now regular await
        await toggleLogReaction(log.id, user.uid, "🔥");
        setIsReacting(false);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this log?")) return;
        if (log.id) await deleteDailyLog(log.id);
        onClose();
    };

    const handleEdit = () => {
        setEditTitle(log.title);
        setEditDesc(log.description);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!log.id) return;
        setIsSaving(true);
        try {
            await updateDailyLog(log.id, {
                title: editTitle,
                description: editDesc
            });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            alert("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#181818] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-[#333] relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white transition-colors">
                        <X size={20} />
                    </button>

                    <div className="flex flex-col md:flex-row h-full max-h-[80vh]">
                        {/* Image Section */}
                        <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative">
                            {log.proofURL ? (
                                <img src={log.proofURL} className="max-w-full max-h-[60vh] object-contain" alt="Proof" />
                            ) : (
                                <div className="text-gray-500">No Image</div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="w-full md:w-1/2 p-6 flex flex-col">
                            <div className="flex-1 overflow-y-auto">
                                <div className="flex items-center gap-3 mb-4">
                                    {/* We normally show avatar here if we had it */}
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white uppercase">
                                        {currentUserName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{currentUserName}</h3>
                                        <p className="text-xs text-[#777]">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="flex flex-col gap-3">
                                        <input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="bg-[#222] border border-[#333] rounded px-3 py-2 text-white font-bold text-xl focus:outline-none focus:border-spotify-green"
                                        />
                                        <textarea
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                            className="bg-[#222] border border-[#333] rounded px-3 py-2 text-white h-32 resize-none focus:outline-none focus:border-spotify-green"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={handleSave} disabled={isSaving} className="bg-spotify-green text-black px-4 py-1 rounded font-bold text-sm">
                                                {isSaving ? "Saving..." : "Save"}
                                            </button>
                                            <button onClick={() => setIsEditing(false)} disabled={isSaving} className="bg-[#333] text-white px-4 py-1 rounded font-bold text-sm">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold mb-2 text-white">{log.title}</h2>
                                        <p className="text-[#b3b3b3] leading-relaxed whitespace-pre-wrap">{log.description}</p>
                                    </>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="pt-6 border-t border-[#333] mt-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={handleReaction}
                                        disabled={isReacting}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${myReaction === "🔥"
                                            ? "bg-orange-500/20 text-orange-500 border border-orange-500/50"
                                            : "bg-[#222] text-[#b3b3b3] hover:bg-[#333]"
                                            }`}
                                    >
                                        <Flame size={20} fill={myReaction === "🔥" ? "currentColor" : "none"} />
                                        <span>{reactionCount || "React"}</span>
                                    </button>

                                    {isOwner && !isEditing && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleEdit} className="p-2 text-[#b3b3b3] hover:text-white hover:bg-[#222] rounded-full transition-colors" title="Edit">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={handleDelete} className="p-2 text-[#b3b3b3] hover:text-red-500 hover:bg-[#222] rounded-full transition-colors" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
