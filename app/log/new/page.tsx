"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStorage } from "@/hooks/useStorage";
import { createDailyLog } from "@/lib/db/logs";
import { updateFriendshipStreak } from "@/lib/db/friends"; // Import this
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { UploadCloud, X } from "lucide-react";

function NewLogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const friendshipId = searchParams.get("friendshipId");
    const { user } = useAuth();
    const { uploadFile, progress, isUploading: isStorageUploading } = useStorage();

    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(f);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !file || !title) return;

        setIsLoading(true);
        try {
            // Upload Image (Base64)
            const base64 = await uploadFile(file, "");

            // Create Log
            await createDailyLog(user.uid, {
                title,
                description,
                proofURL: base64,
                proofStoragePath: "inline-base64",
                pomodoroMinutes: 0,
                friendshipId: friendshipId || undefined
            });

            // If this is a friendship streak, update the streak count!
            if (friendshipId) {
                await updateFriendshipStreak(friendshipId);
                router.push("/streak/" + friendshipId);
            } else {
                router.push("/profile");
            }
        } catch (error: any) {
            console.error("Submission failed", error);
            if (error.message && error.message.includes("does not have HTTP ok status")) {
                alert("Upload failed due to a Cloud Storage CORS error. Please run the CORS configuration command provided in the chat.");
            } else {
                alert("Failed to submit: " + error.message);
            }
        } finally {
            console.log("Submission Process Finished");
            setIsLoading(false);
        }
    };

    const isBusy = isLoading || isStorageUploading;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-[#181818] relative">
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white"
                >
                    <X size={24} />
                </button>

                <h1 className="text-2xl font-bold text-white mb-6">Log Activity</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Input
                        label="Activity Title"
                        placeholder="e.g., Coding Streakify"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                    />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-white">Description</label>
                        <textarea
                            className="w-full h-24 rounded bg-[#121212] border border-[#282828] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white resize-none"
                            placeholder="What did you accomplish?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-white">Proof of Work</label>
                        <div className="border-2 border-dashed border-[#282828] rounded-lg p-8 flex flex-col items-center justify-center text-[#b3b3b3] hover:border-white hover:text-white transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                required
                            />
                            {file ? (
                                <div className="text-center">
                                    <span className="text-spotify-green font-bold block mb-2">{file.name}</span>
                                    <span className="text-xs">Click to change</span>
                                </div>
                            ) : (
                                <>
                                    <UploadCloud size={32} className="mb-2" />
                                    <span className="font-bold">Upload Screenshot</span>
                                    <span className="text-xs mt-1">Supports JPG, PNG</span>
                                </>
                            )}
                        </div>
                    </div>

                    {isBusy && (
                        <div className="w-full bg-[#333] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-spotify-green h-full transition-all duration-300"
                                style={{ width: progress + "%" }}
                            />
                        </div>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        isLoading={isBusy}
                        disabled={!file || !title}
                    >
                        {isBusy ? "Uploading..." : "Submit Log"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default function NewLogPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
            <NewLogContent />
        </Suspense>
    );
}
