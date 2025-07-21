import Link from "next/link";
import React from "react";

interface MenuCardButtonProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColorClass: string;
}

export default function MenuCardButton({
  href,
  icon,
  title,
  description,
  bgColorClass,
}: MenuCardButtonProps) {
  return (
    <Link href={href}>
      <div
        className={`group relative block h-full bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transform transition duration-300 ease-in-out hover:scale-105`}
      >
        <div
          className={`absolute inset-0 ${bgColorClass} rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
        ></div>
        <div className="relative flex items-start space-x-4">
          <div className="flex-shrink-0">{icon}</div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
} 