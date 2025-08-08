
"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("test1@example.com");
  const [password, setPassword] = useState("test1123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  // 既にログインしている場合はリダイレクト
  useEffect(() => {
    if (session) {
      if ((session.user as any)?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard/employee");
      }
    }
  }, [session, router]);

  const showMessage = (message: string, type: 'error' | 'success') => {
    if (type === 'error') {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
    
    // 5秒後に自動で非表示
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // バリデーション
    if (!email || !password) {
      showMessage('メールアドレスとパスワードを入力してください', 'error');
      return;
    }
    
    if (!validateEmail(email)) {
      showMessage('有効なメールアドレスを入力してください', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('パスワードは6文字以上である必要があります', 'error');
      return;
    }
    
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        showMessage('ログインしました！リダイレクトしています...', 'success');
        
        // 2秒後にリダイレクト
        setTimeout(async () => {
          const session = await getSession();
          if ((session?.user as any)?.role === "ADMIN") {
            router.push("/admin/dashboard");
          } else {
            router.push("/dashboard/employee");
          }
        }, 2000);
      } else {
        showMessage('メールアドレスまたはパスワードが正しくありません', 'error');
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage('ログイン中にエラーが発生しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const showForgotPassword = () => {
    alert('パスワードリセット機能は開発中です。\n\nデモ用認証情報:\nメール: test1@example.com\nパスワード: test1123');
  };

  const showSupport = () => {
    alert('サポート情報:\n\n📞 電話: 03-1234-5678\n📧 メール: support@example.com\n⏰ 受付時間: 平日 9:00-18:00');
  };

  const showPrivacy = () => {
    alert('プライバシーポリシー:\n\n当システムは個人情報を適切に管理し、第三者に提供することはありません。詳細は管理者にお問い合わせください。');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-md animate-fadeInUp">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-teal-400 to-teal-500 text-white p-10 pb-8 text-center">
          <div className="text-2xl font-bold mb-2">シフト管理システム</div>
          <div className="text-lg opacity-90">従業員ログイン</div>
        </div>
        
        {/* フォーム */}
        <div className="p-10">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-8">ログイン</h2>
          
          {/* デモ用認証情報 */}
          <div className="bg-gray-50 p-4 rounded-lg mb-5 text-xs text-gray-600">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">🎯 デモ用認証情報</h4>
            <p><strong>メール:</strong> test1@example.com</p>
            <p><strong>パスワード:</strong> test1123</p>
          </div>
          
          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}
          
          {/* 成功メッセージ */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-lg mb-5 text-sm">
              {success}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  placeholder="パスワードを入力"
                  required
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-400 text-lg p-1"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-8 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-teal-400"
                />
                <span>ログイン状態を保持</span>
              </label>
              <button
                type="button"
                onClick={showForgotPassword}
                className="text-teal-400 font-medium hover:underline"
              >
                パスワードを忘れた場合
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-bold rounded-xl text-base transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin mr-2"></div>
                  ログイン中...
                </div>
              ) : (
                "ログイン"
              )}
            </button>
          </form>
          
          {/* フッターリンク */}
          <div className="text-center mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-center gap-6 text-sm">
              <button
                onClick={showSupport}
                className="text-gray-600 hover:text-teal-400"
              >
                サポート
              </button>
              <button
                onClick={showPrivacy}
                className="text-gray-600 hover:text-teal-400"
              >
                プライバシーポリシー
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
