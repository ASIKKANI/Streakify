import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    Timestamp,
    getDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    addDoc,
    orderBy
} from "firebase/firestore";

export interface Room {
    id: string;
    hostId: string;
    hostName: string;
    name?: string;
    status: 'focus' | 'break' | 'idle';
    startTime: Timestamp | null;
    duration: number; // in seconds
    members: { uid: string; name: string; photo?: string; bio?: string; currentTask?: string }[];
    memberIds: string[]; // For efficient querying
    active: boolean;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: Timestamp;
    isSystem?: boolean;
}

export async function createRoom(hostId: string, hostName: string, roomName: string = "", photo: string = "", bio: string = "") {
    const roomRef = doc(collection(db, "rooms"));
    const roomId = roomRef.id;

    const newRoom: Room = {
        id: roomId,
        hostId,
        hostName,
        name: roomName || `${hostName}'s Room`,
        status: 'idle',
        startTime: null,
        duration: 25 * 60, // Default 25m
        members: [{ uid: hostId, name: hostName, photo, bio, currentTask: "" }],
        memberIds: [hostId],
        active: true
    };

    await setDoc(roomRef, newRoom);
    return roomId;
}

export async function joinRoom(roomId: string, userId: string, userName: string, photoURL?: string, bio?: string) {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) throw new Error("Room not found");

    // Add member
    // We used arrayUnion but that only works for exact object matches.
    // Ideally we check if member exists. For simplicity here:
    // We will read current members, filter out self, and add self with updated info.
    // Or just use arrayUnion if we assume immutable identity, but photo/bio might change.

    // Let's stick to simple arrayUnion for now, but really we should properly manage the list.
    // For a better experience, let's read and write.

    // Actually, for real-time presence, a subcollection 'members' is better, but to keep it simple as per request:
    // We'll trust arrayUnion for now, or just force update.

    // Better strategy for this task: simple update without full overwrite risk on concurrent joins.
    // We'll stick to arrayUnion for simplicity, assuming data doesn't change mid-session often.
    // But wait, if I update my bio, I want it to show. 
    // Let's do a transaction-like update or just get-modify-set for the members array.

    const currentMembers = roomSnap.data().members || [];
    const existingMember = currentMembers.find((m: any) => m.uid === userId);
    const otherMembers = currentMembers.filter((m: any) => m.uid !== userId);
    const newMember = {
        uid: userId,
        name: userName,
        photo: photoURL || "",
        bio: bio || "",
        currentTask: existingMember?.currentTask || ""
    };

    await updateDoc(roomRef, {
        members: [...otherMembers, newMember],
        memberIds: arrayUnion(userId)
    });
}

export async function updateMemberStatus(roomId: string, userId: string, task: string) {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    const currentMembers = roomSnap.data().members || [];
    const newMembers = currentMembers.map((m: any) =>
        m.uid === userId ? { ...m, currentTask: task } : m
    );

    await updateDoc(roomRef, { members: newMembers });
}

export async function leaveRoom(roomId: string, userId: string) {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const currentMembers = roomSnap.data().members || [];
    const newMembers = currentMembers.filter((m: any) => m.uid !== userId);

    await updateDoc(roomRef, {
        members: newMembers,
        memberIds: arrayRemove(userId)
    });
}

export async function deleteRoom(roomId: string) {
    const roomRef = doc(db, "rooms", roomId);
    await deleteDoc(roomRef);
}

// Shared Tasks
export interface RoomTask {
    id: string;
    text: string;
    completed: boolean;
    addedBy: string;
    addedByName: string;
    createdAt: Timestamp;
}

export async function addRoomTask(roomId: string, text: string, userId: string, userName: string) {
    const tasksRef = collection(db, "rooms", roomId, "tasks");
    await addDoc(tasksRef, {
        text,
        completed: false,
        addedBy: userId,
        addedByName: userName,
        createdAt: serverTimestamp()
    });
}

export async function toggleRoomTask(roomId: string, taskId: string, completed: boolean) {
    const taskRef = doc(db, "rooms", roomId, "tasks", taskId);
    await updateDoc(taskRef, { completed });
}

export async function deleteRoomTask(roomId: string, taskId: string) {
    const taskRef = doc(db, "rooms", roomId, "tasks", taskId);
    await deleteDoc(taskRef);
}

export function listenToRoomTasks(roomId: string, callback: (tasks: RoomTask[]) => void) {
    const tasksRef = collection(db, "rooms", roomId, "tasks");
    const q = query(tasksRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomTask));
        callback(tasks);
    });
}

// Host controls
export async function updateRoomStatus(roomId: string, status: 'focus' | 'break' | 'idle', duration: number = 25 * 60) {
    const roomRef = doc(db, "rooms", roomId);
    const updates: any = {
        status,
        duration
    };

    if (status !== 'idle') {
        // Only set startTime if we are STARTING/RESUMING
        // If we pause (idle), we don't clear startTime necessarily if we want to track accumulated, 
        // but here our logic is simplistic: Idle = no timer running.
        updates.startTime = serverTimestamp();
    } else {
        updates.startTime = null;
    }

    await updateDoc(roomRef, updates);
}

// Real-time listener
export function listenToRoom(roomId: string, callback: (room: Room | null) => void) {
    const roomRef = doc(db, "rooms", roomId);
    return onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as Room);
        } else {
            callback(null); // Room deleted
        }
    });
}

// Chat Functions
export async function sendMessage(roomId: string, senderId: string, senderName: string, text: string) {
    const messagesRef = collection(db, "rooms", roomId, "messages");
    await setDoc(doc(messagesRef), {
        senderId,
        senderName,
        text,
        createdAt: serverTimestamp()
    });
}

export async function sendSystemMessage(roomId: string, text: string) {
    const messagesRef = collection(db, "rooms", roomId, "messages");
    await setDoc(doc(messagesRef), {
        senderId: "system",
        senderName: "System",
        text,
        isSystem: true,
        createdAt: serverTimestamp()
    });
}

export function listenToMessages(roomId: string, callback: (msgs: Message[]) => void) {
    const messagesRef = collection(db, "rooms", roomId, "messages");
    // Order by createdAt
    // Firestore requires an index for ordering often, but basic might work.
    // Use query if needed: const q = query(messagesRef, orderBy("createdAt", "asc"));
    // For now, let's just get them. If order is random, we sort in client.

    return onSnapshot(messagesRef, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        // Client-side sort to avoid index requirements for now (safe for small chat)
        msgs.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return a.createdAt.toMillis() - b.createdAt.toMillis();
        });
        callback(msgs);
    });
}

export function listenToUserRooms(userId: string, callback: (rooms: Room[]) => void) {
    const roomsRef = collection(db, "rooms");
    const q = query(roomsRef, where("memberIds", "array-contains", userId));
    return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map(doc => doc.data() as Room);
        callback(rooms);
    });
}
