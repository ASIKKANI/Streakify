import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp, serverTimestamp } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    name: string;
    username: string;
    email: string;
    photoURL?: string;
    createdAt: Timestamp;
    streakCount: number;
    productivityScore: number;
    friends: string[];
    lastSubmission?: Timestamp;
    bio?: string;
}

export async function createUserProfile(uid: string, data: { name: string; username: string; email: string }) {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newUser: UserProfile = {
            uid,
            name: data.name,
            username: data.username,
            email: data.email,
            photoURL: "",
            createdAt: serverTimestamp() as Timestamp, // Cast for initial write
            streakCount: 0,
            productivityScore: 0,
            friends: [],
            bio: "",
        };

        await setDoc(userRef, newUser);
        return newUser;
    }

    return userSnap.data() as UserProfile;
}

export async function getUserProfile(uid: string) {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
}

export async function updateUserStreak(uid: string) {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data() as UserProfile;
    const now = new Date();
    const lastSubmission = userData.lastSubmission?.toDate();

    let newStreak = userData.streakCount || 0;

    if (lastSubmission) {
        const isToday = lastSubmission.getDate() === now.getDate() &&
            lastSubmission.getMonth() === now.getMonth() &&
            lastSubmission.getFullYear() === now.getFullYear();

        if (isToday) {
            // Already submitted today, don't increment
            return newStreak;
        }

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        // Simple check: strictly equal to yesterday's date part
        const isYesterday = lastSubmission.getDate() === yesterday.getDate() &&
            lastSubmission.getMonth() === yesterday.getMonth() &&
            lastSubmission.getFullYear() === yesterday.getFullYear();

        if (isYesterday) {
            newStreak += 1;
        } else {
            // Missed a day -> Reset
            // Note: If lastSubmission was today, we already returned.
            // If lastSubmission was older than yesterday, reset.
            newStreak = 1;
        }
    } else {
        // First submission
        newStreak = 1;
    }

    await setDoc(userRef, {
        streakCount: newStreak,
        lastSubmission: serverTimestamp()
    }, { merge: true });

    return newStreak;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, data, { merge: true });
}

import { collection, getDocs, limit, query } from "firebase/firestore";

export async function getAllUsers() {
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
}
