"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { LayoutDashboard, Library, FileQuestion, Users, CheckSquare, Settings, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const rawNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "STUDENT"] },
    { name: "Question Bank", href: "/questions", icon: Library, roles: ["ADMIN", "TEACHER"] },
    { name: "Tests & Assignments", href: "/tests", icon: FileQuestion, roles: ["ADMIN", "TEACHER", "STUDENT"] },
    { name: "Students", href: "/students", icon: Users, roles: ["ADMIN", "TEACHER"] },
    { name: "Attendance", href: "/attendance", icon: CheckSquare, roles: ["ADMIN", "TEACHER"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const [mobileOpen, setMobileOpen] = useState(false)

    // Filter items based on user role — fallback to showing all ADMIN items if role is missing
    const userRole = user?.role || "ADMIN"
    const navItems = rawNavItems.filter((item) => item.roles.includes(userRole))

    const sidebarContent = (
        <>
            <div className="flex h-14 items-center border-b px-6 justify-between">
                <span className="text-xl font-bold tracking-tight text-primary">Coaching Pro</span>
                {/* Mobile close button */}
                <button
                    className="md:hidden p-1 rounded-md hover:bg-accent"
                    onClick={() => setMobileOpen(false)}
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {(user?.name || "A").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user?.name || "Admin"}</span>
                        <span className="text-xs text-muted-foreground capitalize">{userRole.toLowerCase()}</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        logout()
                        window.location.href = '/login'
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-card border shadow-sm"
                onClick={() => setMobileOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar (slide-in) */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-lg transform transition-transform duration-200 ease-in-out md:hidden",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col">
                    {sidebarContent}
                </div>
            </div>

            {/* Desktop sidebar (always visible) */}
            <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card text-card-foreground shadow-sm flex-shrink-0">
                {sidebarContent}
            </div>
        </>
    )
}
