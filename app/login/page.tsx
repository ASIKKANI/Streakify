"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                setError("Incorrect email or password.");
            } else {
                setError("An error occurred during login. Please try again.");
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <div className="w-full max-w-sm flex flex-col items-center gap-8">
                {/* Logo Placeholder */}
                <h1 className="text-4xl font-bold tracking-tighter text-white">
                    Streakify
                </h1>

                <Card className="w-full bg-black border-0 shadow-none p-0 sm:bg-[#121212] sm:border sm:p-8">
                    <h2 className="text-center text-xl font-bold mb-8">Log in to continue.</h2>

                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <Input
                            id="email"
                            label="Email address"
                            placeholder="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            required
                        />
                        <Input
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            required
                        />

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" variant="primary" fullWidth className="mt-4 rounded-full" isLoading={isLoading}>
                            Log In
                        </Button>
                    </form>

                    <div className="my-8 border-b border-[#292929]" />

                    <div className="text-center">
                        <p className="text-[#a7a7a7] text-sm">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-white hover:underline underline-offset-2">
                                Sign up for Streakify
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </main>
    );
}
