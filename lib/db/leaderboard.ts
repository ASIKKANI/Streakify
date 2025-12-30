import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { UserProfile } from "./users";

export async function getGlobalLeaderboard(limitCount = 50) {
    const usersRef = collection(db, "users");

    // Query by Streak Count (Primary metric for now)
    const q = query(
        usersRef,
        orderBy("streakCount", "desc"),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function getTopScorers(limitCount = 50) {
    const usersRef = collection(db, "users");
    const q = query(
        usersRef,
        orderBy("productivityScore", "desc"),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
}
