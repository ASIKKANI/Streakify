import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";

export interface Task {
    id: string;
    userId: string;
    text: string;
    completed: boolean;
    createdAt: Timestamp;
}

export async function addTask(userId: string, text: string) {
    const taskRef = doc(collection(db, "tasks"));
    await setDoc(taskRef, {
        id: taskRef.id,
        userId,
        text,
        completed: false,
        createdAt: serverTimestamp()
    });
}

export async function toggleTask(taskId: string, currentStatus: boolean) {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
        completed: !currentStatus
    });
}

export async function deleteTask(taskId: string) {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
}

export function listenToTasks(userId: string, callback: (tasks: Task[]) => void) {
    const tasksRef = collection(db, "tasks");
    const q = query(
        tasksRef,
        where("userId", "==", userId)
        // Note: Composite index might be needed for where + orderBy. 
        // If it errors, we'll sort client-side or prompt to create index.
        // Let's try client-side sort for simplicity first if volume is low.
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => doc.data() as Task);
        // Client-side sort by createdAt desc
        tasks.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        callback(tasks);
    });
}
