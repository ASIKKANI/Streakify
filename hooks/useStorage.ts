"use client";

import { useState } from "react";

export function useStorage() {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file: File, path: string) => {
        setIsUploading(true);
        setProgress(10);
        setError(null);

        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = MAX_WIDTH;
                    const height = img.height * scaleSize;

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG at 60% quality to save space (Firestore limit 1MB)
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

                    setProgress(100);
                    setUrl(dataUrl);
                    setIsUploading(false);
                    resolve(dataUrl);
                };
                img.onerror = (err) => {
                    setError("Failed to process image");
                    setIsUploading(false);
                    reject(err);
                };
            };
            reader.onerror = (err) => {
                setError("Failed to read file");
                setIsUploading(false);
                reject(err);
            };
        });
    };

    return { progress, error, url, isUploading, uploadFile };
}
