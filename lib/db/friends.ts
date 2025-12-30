import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, query, where, Timestamp, serverTimestamp, getDoc, updateDoc, onSnapshot } from "firebase/firestore";

export interface Friendship {
    id: string;
    members: string[]; // [uid1, uid2]
    memberData: {
        [uid: string]: {
            name: string;
            photo?: string;
        };
    };
    streakCount: number;
    lastLogDate: Timestamp | null;
    createdAt: Timestamp;
}

export async function createFriendship(currentUserId: string, currentUserData: { name: string, photo?: string }, otherUserId: string, otherUserData: { name: string, photo?: string }) {
    // Check if exists
    const q = query(collection(db, "friendships"), where("members", "array-contains", currentUserId));
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(d => d.data().members.includes(otherUserId));

    if (existing) return existing.id; // Already friends

    const newRef = doc(collection(db, "friendships"));
    const friendship: Friendship = {
        id: newRef.id,
        members: [currentUserId, otherUserId],
        memberData: {
            [currentUserId]: { name: currentUserData.name, photo: currentUserData.photo || "" },
            [otherUserId]: { name: otherUserData.name, photo: otherUserData.photo || "" }
        },
        streakCount: 0,
        lastLogDate: null,
        createdAt: serverTimestamp() as Timestamp
    };

    await setDoc(newRef, friendship);
    return newRef.id;
}

export function listenToFriendships(userId: string, callback: (friendships: Friendship[]) => void) {
    const q = query(collection(db, "friendships"), where("members", "array-contains", userId));

    return onSnapshot(q, (snapshot) => {
        const friendships = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Friendship));
        callback(friendships);
    });
}

export async function updateFriendshipStreak(friendshipId: string) {
    const ref = doc(db, "friendships", friendshipId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data() as Friendship;
    // Simple logic: If lastLogDate is NOT today (or null), increment streak.
    const now = new Date();
    const last = data.lastLogDate?.toDate();

    let shouldIncrement = false;
    if (!last) {
        shouldIncrement = true;
    } else {
        const isToday = last.getDate() === now.getDate() &&
            last.getMonth() === now.getMonth() &&
            last.getFullYear() === now.getFullYear();
        if (!isToday) shouldIncrement = true;
    }

    if (shouldIncrement) {
        await updateDoc(ref, {
            streakCount: (data.streakCount || 0) + 1,
            lastLogDate: serverTimestamp()
        });
    }
}

export async function getFriendship(id: string) {
    const docRef = doc(db, "friendships", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() } as Friendship;
    return null;
}
