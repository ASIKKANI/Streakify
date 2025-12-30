"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/db/users";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!formData.name || !formData.username) {
            setError("Please fill in all fields.");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create Firestore Profile
            await createUserProfile(user.uid, {
                name: formData.name,
                username: formData.username,
                email: formData.email,
            });

            // 3. Redirect
            router.push("/");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email is already registered.");
            } else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <div className="w-full max-w-sm flex flex-col items-center gap-8">
                <h1 className="text-4xl font-bold tracking-tighter text-white">
                    Streakify
                </h1>

                <Card className="w-full bg-black border-0 shadow-none p-0 sm:bg-[#121212] sm:border sm:p-8">
                    <h2 className="text-center text-xl font-bold mb-8">Sign up to start streaking.</h2>

                    <form onSubmit={handleSignup} className="flex flex-col gap-4">
                        <Input
                            id="name"
                            label="Full Name"
                            placeholder="What should we call you?"
                            value={formData.name}
                            onChange={handleChange}
                            fullWidth
                        />
                        <Input
                            id="username"
                            label="Username"
                            placeholder="Choose a unique username"
                            value={formData.username}
                            onChange={handleChange}
                            fullWidth
                        />
                        <Input
                            id="email"
                            label="Email"
                            placeholder="name@domain.com"
                            value={formData.email}
                            onChange={handleChange}
                            fullWidth
                        />
                        <Input
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            fullWidth
                        />

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" variant="primary" fullWidth className="mt-4 rounded-full" isLoading={isLoading}>
                            Sign Up
                        </Button>
                    </form>

                    <div className="my-8 border-b border-[#292929]" />

                    <div className="text-center">
                        <p className="text-[#a7a7a7] text-sm">
                            Have an account?{" "}
                            <Link href="/login" className="text-white hover:underline underline-offset-2">
                                Log in
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </main>
    );
}
