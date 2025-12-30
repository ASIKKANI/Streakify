"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStorage } from "@/hooks/useStorage";
import { updateDailyLog, getLogById } from "@/lib/db/logs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { UploadCloud, X, Trash2 } from "lucide-react";

export default function EditLogPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const { uploadFile, progress, isUploading: isStorageUploading } = useStorage();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [existingProof, setExistingProof] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const logId = params.logId as string;

    useEffect(() => {
        if (!logId) return;
        getLogById(logId).then((log) => {
            if (log) {
                if (user && log.userId !== user.uid) {
                    alert("Unauthorized");
                    router.push("/");
                    return;
                }
                setTitle(log.title);
                setDescription(log.description);
                setExistingProof(log.proofURL || "");
            }
            setIsLoadingData(false);
        });
    }, [logId, user, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title) return;

        setIsSubmitting(true);
        try {
            let proofURL = existingProof;

            if (file) {
                // 1. Process New Image (Compress & Convert to Base64)
                proofURL = await uploadFile(file, "");
            }

            // 2. Update Log Entry
            await updateDailyLog(logId, {
                title,
                description,
                proofURL,
            });

            // 3. Redirect
            router.push("/profile");
        } catch (error: any) {
            console.error("Update failed", error);
            alert(`Failed to update: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isStorageUploading || isSubmitting;

    if (isLoadingData) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-[#181818] relative">
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white"
                >
                    <X size={24} />
                </button>

                <h1 className="text-2xl font-bold text-white mb-6">Edit Activity</h1>

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

                        {/* Preview Existing */}
                        {existingProof && !file && (
                            <div className="mb-2 w-full h-40 bg-black rounded border border-[#333] overflow-hidden relative">
                                <img src={existingProof} alt="Proof" className="w-full h-full object-cover opacity-70" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="bg-black/80 px-2 py-1 rounded text-xs">Current Proof</span>
                                </div>
                            </div>
                        )}

                        <div className="border-2 border-dashed border-[#282828] rounded-lg p-8 flex flex-col items-center justify-center text-[#b3b3b3] hover:border-white hover:text-white transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            {file ? (
                                <div className="text-center">
                                    <span className="text-spotify-green font-bold block mb-2">{file.name}</span>
                                    <span className="text-xs">Click to change</span>
                                </div>
                            ) : (
                                <>
                                    <UploadCloud size={32} className="mb-2" />
                                    <span className="font-bold">Change Screenshot</span>
                                    <span className="text-xs mt-1">Supports JPG, PNG</span>
                                </>
                            )}
                        </div>
                    </div>

                    {isLoading && (
                        <div className="w-full bg-[#333] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-spotify-green h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        isLoading={isLoading}
                        disabled={!title}
                    >
                        {isLoading ? "Updating..." : "Update Log"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
