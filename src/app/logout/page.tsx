"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut({ 
          redirect: false,
          callbackUrl: "/login"
        });
        // ログアウト後にログインページにリダイレクト
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        // エラーが発生してもログインページにリダイレクト
        router.push("/login");
      }
    };

    // セッションが存在する場合のみログアウトを実行
    if (session) {
      performLogout();
    } else {
      // セッションが存在しない場合は直接ログインページにリダイレクト
      router.push("/login");
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ログアウト中...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ログアウト処理を実行しています。しばらくお待ちください。
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 