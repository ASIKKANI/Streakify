import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, orderBy, limit, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { updateUserStreak } from "./users";


export interface DailyLog {
    id?: string;
    userId: string;
    title: string;
    description: string;
    proofURL?: string;
    proofStoragePath?: string;
    timestamp: any;
    pomodoroMinutes: number;
    friendshipId?: string;
    reactions?: { [userId: string]: string }; // Map userId -> emoji
}

export async function createDailyLog(userId: string, data: { title: string; description: string; proofURL: string; proofStoragePath: string; pomodoroMinutes: number; friendshipId?: string }) {
    // Check if already logged today? (Optional logic, standard streak allows multiple but only one counts, or maybe block?)
    // PRD: "Daily Productivity Logging"

    const logRef = collection(db, "dailyLogs");

    const newLog = {
        userId,
        title: data.title,
        description: data.description,
        proofURL: data.proofURL,
        proofStoragePath: data.proofStoragePath,
        pomodoroMinutes: data.pomodoroMinutes || 0,
        friendshipId: data.friendshipId || null, // FIX: Save this field!
        timestamp: serverTimestamp(),
        verified: false, // Default
        reactions: {},
    };

    const docRef = await addDoc(logRef, newLog);

    // Trigger Streak Update
    // Note: In production, this might be better in a Cloud Function trigger on specific write.
    await updateUserStreak(userId);

    return { id: docRef.id, ...newLog };
}

export async function toggleLogReaction(logId: string, userId: string, reaction: string) {
    const logRef = doc(db, "dailyLogs", logId);
    const snap = await getDoc(logRef);
    if (!snap.exists()) return;

    const currentData = snap.data() as DailyLog;
    const reactions = currentData.reactions || {};

    if (reactions[userId] === reaction) {
        delete reactions[userId]; // Toggle off
    } else {
        reactions[userId] = reaction; // Set new
    }

    await updateDoc(logRef, { reactions });
}

export async function getTodaysLog(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const logsRef = collection(db, "dailyLogs");
    const q = query(
        logsRef,
        where("userId", "==", userId),
        where("timestamp", ">=", startOfDay)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
}

export async function getRecentLogs() {
    const logsRef = collection(db, "dailyLogs");
    // Simple query for now. Ideally should index and sort by timestamp desc
    const q = query(logsRef, orderBy("timestamp", "desc"), limit(20));

    // Note: orderBy requires index if combining filter. Here just checking all.
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateDailyLog(logId: string, data: Partial<DailyLog>) {
    const logRef = doc(db, "dailyLogs", logId);
    await updateDoc(logRef, data);
}

export async function deleteDailyLog(logId: string) {
    const logRef = doc(db, "dailyLogs", logId);
    await deleteDoc(logRef);
}

export async function getLogById(logId: string) {
    const logRef = doc(db, "dailyLogs", logId);
    const snap = await getDoc(logRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as DailyLog;
}
