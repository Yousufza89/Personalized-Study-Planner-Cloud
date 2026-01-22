"use client";

import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [isDevMode, setIsDevMode] = useState(true); // Default to true for easier testing
  const [azureAvailable, setAzureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSignIn = () => {
    signIn("azure-ad", { callbackUrl: "/dashboard" });
  };

  useEffect(() => {
    // Check NextAuth providers endpoint to see if Azure AD is configured
    const checkProviders = async () => {
      try {
        const res = await fetch('/api/auth/providers');
        if (!res.ok) {
          setAzureAvailable(false);
          return;
        }
        const data = await res.json();
        setAzureAvailable(Boolean(data && data['azure-ad']));
      } catch (err) {
        setAzureAvailable(false);
      }
    };
    checkProviders();
  }, []);

  const handleDevSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const result = await signIn("credentials", {
        email: email || "demo@example.com",
        redirect: false,
      });
      if (result?.ok) {
        router.push("/dashboard");
        router.refresh(); // Refresh to update session
      } else if (result?.error) {
        console.error("Login error:", result.error);
        alert("Login failed: " + result.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleQuickLogin = async () => {
    try {
      const result = await signIn("credentials", {
        email: "demo@example.com",
        redirect: false,
      });
      if (result?.ok) {
        router.push("/dashboard");
      } else if (result?.error) {
        console.error("Login error:", result.error);
        alert("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Study Planner
            </h1>
            <p className="text-gray-600">
              Sign in to manage your study schedules
            </p>
          </div>

          {/* Azure AD Login - always visible, enable only if provider present */}
          <div className="mb-4">
            <Button
              onClick={() => {
                if (azureAvailable === false) {
                  alert('Azure AD provider not configured. Please set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET and AZURE_AD_TENANT_ID in your environment (see README).');
                  return;
                }
                handleSignIn();
              }}
              variant="primary"
              size="lg"
              className="w-full mb-2"
              disabled={azureAvailable === false}
            >
              <Image src="/microsoft.svg" alt="Microsoft" width={20} height={20} />
              Sign in with Microsoft
            </Button>
            {azureAvailable === null && (
              <p className="text-xs text-gray-500 gap-4">Checking Microsoft sign-in availability...</p>
            )}
            {azureAvailable === false && (
              <p className="text-xs text-red-600">Microsoft sign-in not configured locally. See README for setup instructions.</p>
            )}
          </div>

          {/* Dev Mode Login - Show if Azure AD not configured */}
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Demo Mode:</strong> Click the button below to login instantly (no Azure AD required)
              </p>
            </div>
            <Button
              onClick={handleQuickLogin}
              variant="primary"
              size="lg"
              className="w-full mb-4"
            >
              🚀 Quick Login (Demo)
            </Button>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Or use custom email:</p>
              <form onSubmit={handleDevSignIn} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                >
                  Sign In
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

