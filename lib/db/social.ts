import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    getDoc,
    Timestamp,
    orderBy,
    startAt,
    endAt
} from "firebase/firestore";
import { UserProfile } from "./users";

export interface FriendRequest {
    id: string;
    fromId: string;
    fromName: string;
    fromPhoto?: string;
    toId: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: Timestamp;
}

// Search users by username (prefix search)
export async function searchUsers(searchTerm: string) {
    if (!searchTerm) return [];

    const usersRef = collection(db, "users");
    // Note: This requires a composite index if combining fields, but simple orderBy("username") is fine.
    // We use startAt/endAt for prefix search. 
    // Assuming 'username' is stored. If not, we search 'name'.

    const q = query(
        usersRef,
        orderBy("username"),
        startAt(searchTerm),
        endAt(searchTerm + "\uf8ff")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function sendFriendRequest(fromUser: UserProfile, toUserId: string) {
    // Check if request already exists? (Omitted for MVP speed, assume UI handles check)
    const requestsRef = collection(db, "friendRequests");
    await addDoc(requestsRef, {
        fromId: fromUser.uid,
        fromName: fromUser.name,
        fromPhoto: fromUser.photoURL || "",
        toId: toUserId,
        status: 'pending',
        timestamp: serverTimestamp()
    });
}

export async function getFriendRequests(userId: string) {
    const requestsRef = collection(db, "friendRequests");
    const q = query(
        requestsRef,
        where("toId", "==", userId),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
}

export async function acceptFriendRequest(requestId: string, fromId: string, toId: string) {
    // 1. Mark request as accepted (or delete it)
    const reqRef = doc(db, "friendRequests", requestId);
    await updateDoc(reqRef, { status: "accepted" }); // Optional: keep history

    // 2. Add to both users' friend lists
    const user1Ref = doc(db, "users", fromId);
    const user2Ref = doc(db, "users", toId);

    await updateDoc(user1Ref, { friends: arrayUnion(toId) });
    await updateDoc(user2Ref, { friends: arrayUnion(fromId) });
}

export async function getFriendsList(userId: string) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return [];

    const friendIds = userSnap.data().friends || [];
    if (friendIds.length === 0) return [];

    // Firestore 'in' query supports up to 10 items. 
    // For MVP we just fetch the top 10 friends. Real app needs batching.
    const chunks = friendIds.slice(0, 10);

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "in", chunks));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as UserProfile);
}
