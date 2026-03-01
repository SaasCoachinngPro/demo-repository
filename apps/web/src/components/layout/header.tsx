"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { Bell, Search } from "lucide-react"

export function Header() {
    const { user } = useAuthStore()

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:h-[60px]">
            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search anything..."
                            className="w-full appearance-none bg-background pl-8 shadow-none border-none outline-none ring-0 h-9 rounded-md text-sm md:w-2/3 lg:w-1/3"
                        />
                    </div>
                </form>
            </div>
            <button className="relative rounded-full p-2 hover:bg-accent text-muted-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user?.name?.charAt(0) || "U"}
            </div>
        </header>
    )
}
