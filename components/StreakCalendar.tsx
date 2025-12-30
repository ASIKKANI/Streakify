"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { clsx } from "clsx";

interface StreakCalendarProps {
    logs: { timestamp: any }[]; // Logs with Firestore timestamps
}

export default function StreakCalendar({ logs }: StreakCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Helper to check if a day has a log
    const getLogForDay = (day: number) => {
        return logs.find(log => {
            const logDate = new Date(log.timestamp.seconds * 1000);
            return logDate.getDate() === day &&
                logDate.getMonth() === currentDate.getMonth() &&
                logDate.getFullYear() === currentDate.getFullYear();
        });
    };

    // Calculate Grid
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return (
        <div className="bg-[#181818] rounded-xl p-6 border border-[#333]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-[#333] rounded text-[#b3b3b3] hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-[#333] rounded text-[#b3b3b3] hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={i} className="text-center text-xs font-bold text-[#b3b3b3] py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
                {totalSlots.map((day, index) => {
                    if (!day) return <div key={index} className="aspect-square"></div>;

                    const hasLog = getLogForDay(day);
                    const isToday = day === new Date().getDate() &&
                        currentDate.getMonth() === new Date().getMonth() &&
                        currentDate.getFullYear() === new Date().getFullYear();

                    return (
                        <div key={index} className="aspect-square flex items-center justify-center relative group cursor-pointer">
                            <div
                                className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                    hasLog ? "bg-spotify-green text-black shadow-[0_0_10px_rgba(29,185,84,0.4)]" : "bg-[#222] text-[#777] group-hover:bg-[#333] group-hover:text-white",
                                    isToday && !hasLog ? "border-2 border-spotify-green text-spotify-green bg-transparent" : ""
                                )}
                            >
                                {day}
                            </div>

                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#333] text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl border border-[#444]">
                                {hasLog ? "🔥 Streak Active" : "No Activity"}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#333]"></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-[#777] justify-center">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-spotify-green"></span>
                    Streak Active
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#222]"></span>
                    No Activity
                </div>
            </div>
        </div>
    );
}
