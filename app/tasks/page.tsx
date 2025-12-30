"use client";

import Sidebar from "@/components/Sidebar";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Circle } from "lucide-react";
import { PageTransition } from "@/components/ui/motion-wrapper";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { addTask, listenToTasks, toggleTask, deleteTask, Task } from "@/lib/db/tasks";

export default function TasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState("");

    useEffect(() => {
        if (user) {
            const unsubscribe = listenToTasks(user.uid, setTasks);
            return () => unsubscribe();
        }
    }, [user]);

    const handleAddTask = async () => {
        if (!newTask.trim() || !user) return;
        try {
            await addTask(user.uid, newTask.trim());
            setNewTask("");
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const handleToggleTask = async (task: Task) => {
        try {
            await toggleTask(task.id, task.completed);
        } catch (error) {
            console.error("Failed to toggle task", error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteTask(taskId);
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 ml-[var(--sidebar-width)] p-4 md:p-8 bg-gradient-to-br from-[#121212] to-black min-h-screen pb-24 md:pb-8 transition-all duration-300">
                <PageTransition className="max-w-4xl mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Tasks</h1>
                        <p className="text-[#b3b3b3] text-sm md:text-base">Manage your daily goals.</p>
                    </div>

                    <Card className="bg-[#181818] p-4 md:p-6 border border-[#333]">
                        <div className="flex gap-2 md:gap-4 mb-6">
                            <Input
                                placeholder="Add a new task..."
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                className="bg-[#222] border-none flex-1 text-sm md:text-base"
                            />
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button onClick={handleAddTask} className="bg-spotify-green text-black h-full px-4">
                                    <Plus size={20} />
                                </Button>
                            </motion.div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <AnimatePresence mode="popLayout">
                                {tasks.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center text-[#555] py-8 text-sm"
                                    >
                                        No tasks yet. Start by adding one!
                                    </motion.div>
                                )}
                                {tasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        layout
                                        className="group flex items-center justify-between p-3 md:p-4 bg-[#222] rounded-lg hover:bg-[#2a2a2a] transition-all border border-transparent hover:border-spotify-green/30"
                                    >
                                        <div className="flex items-center gap-3 md:gap-4 cursor-pointer flex-1" onClick={() => handleToggleTask(task)}>
                                            <motion.div
                                                whileTap={{ scale: 1.2 }}
                                                className="shrink-0"
                                            >
                                                {task.completed ? (
                                                    <CheckCircle className="text-spotify-green" size={20} />
                                                ) : (
                                                    <Circle className="text-gray-500 group-hover:text-white" size={20} />
                                                )}
                                            </motion.div>
                                            <span className={`text-sm md:text-base transition-all ${task.completed ? 'line-through text-gray-500 italic' : 'text-white font-medium'}`}>
                                                {task.text}
                                            </span>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.1, color: "#ef4444" }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTask(task.id);
                                            }}
                                            className="text-gray-500 transition-colors p-1"
                                        >
                                            <Trash2 size={18} />
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </Card>
                </PageTransition>
            </main>
        </div>
    );
}
