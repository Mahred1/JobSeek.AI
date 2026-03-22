'use client';

import Link from "next/link";
import { Button } from "../ui/button";
import { useAuth } from "@/context/auth-context";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold gradient-text">QualifyAI</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/learning-paths"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Learning Paths
              </Link>
              <Link
                href="/dashboard/skill-gap"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Skill Gap Analysis
              </Link>
              <Link
                href="/dashboard/resume"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Resume Enhancement
              </Link>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  {user?.full_name || user?.email}
                </div>
                <Button size="sm" variant="outline" onClick={logout}>
                  Sign out
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm">Sign in</Button>
                </Link>
                <Link href="/register" className="ml-2">
                  <Button size="sm" variant="outline">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 