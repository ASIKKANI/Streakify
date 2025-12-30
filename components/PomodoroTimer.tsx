"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "break">("focus");

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Play sound?
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode: "focus" | "break") => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = mode === "focus"
        ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
        : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

    return (
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full mx-auto">
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => switchMode("focus")}
                    className={`px-4 py-2 rounded-full font-bold transition-colors ${mode === "focus" ? "bg-white text-black" : "text-[#b3b3b3] hover:text-white"}`}
                >
                    Focus
                </button>
                <button
                    onClick={() => switchMode("break")}
                    className={`px-4 py-2 rounded-full font-bold transition-colors ${mode === "break" ? "bg-white text-black" : "text-[#b3b3b3] hover:text-white"}`}
                >
                    Break
                </button>
            </div>

            {/* Timer Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Ring */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="128" cy="128" r="120" stroke="#333" strokeWidth="8" fill="none" />
                    <motion.circle
                        cx="128" cy="128" r="120"
                        stroke={mode === "focus" ? "#1DB954" : "#ff9900"}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                        initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress / 100) }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute text-5xl font-black tabular-nums tracking-tighter">
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="flex gap-4">
                <Button onClick={toggleTimer} variant="primary" className="w-32">
                    {isActive ? <Pause fill="black" /> : <Play fill="black" />}
                </Button>
                <Button onClick={resetTimer} variant="secondary">
                    <RotateCcw />
                </Button>
            </div>
        </div>
    );
}
