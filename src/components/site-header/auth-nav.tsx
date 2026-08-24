"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import {

  Cog,

  Heart,
  HeartHandshake,

  Home,

  LayoutDashboard,

  Info,

  Loader2,

  Lock,

  LogOut,

  Monitor,

  Moon,

  Shield,

  Sun,

  SunMoon,

  User2,

} from "lucide-react";

import { useTheme } from "next-themes";

import { toast } from "sonner";



import type { AuthUser } from "@/context/firebase-auth-context";

import type { FirestoreUser } from "@/lib/firebase-auth-service";



import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuLabel,

  DropdownMenuPortal,

  DropdownMenuSeparator,

  DropdownMenuSub,

  DropdownMenuSubContent,

  DropdownMenuSubTrigger,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMounted } from "@/hooks/use-mounted";

function getInitials(
  authUser: AuthUser,
  profile: FirestoreUser | null
): string {

  if (profile?.firstName && profile?.lastName) {

    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  }



  if (authUser.displayName) {

    const parts = authUser.displayName.trim().split(/\s+/);

    if (parts.length >= 2) {

      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();

    }

    return parts[0]![0]?.toUpperCase() ?? "U";

  }



  if (authUser.email) {

    return authUser.email[0]?.toUpperCase() ?? "U";

  }



  return "U";

}



function getDisplayName(

  authUser: AuthUser,

  profile: FirestoreUser | null

): string {

  if (profile?.firstName || profile?.lastName) {

    return `${profile.firstName} ${profile.lastName}`.trim();

  }

  return authUser.displayName ?? "User";

}



type UserAvatarProps = {

  authUser: AuthUser;

  profile: FirestoreUser | null;

  className?: string;

};



function UserAvatar({ authUser, profile, className }: UserAvatarProps) {

  const displayName = getDisplayName(authUser, profile);

  const initials = getInitials(authUser, profile);



  return (

    <Avatar className={className}>

      {authUser.photoURL ?

        <AvatarImage

          src={authUser.photoURL}

          alt={displayName}

          referrerPolicy="no-referrer"

        />

      : null}

      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">

        {initials}

      </AvatarFallback>

    </Avatar>

  );

}



export function AuthNav() {

  const { authUser, profile, isAdmin, loading, signOut } = useFirebaseAuth();

  const { setTheme } = useTheme();

  const router = useRouter();

  const mounted = useMounted();



  if (loading || !mounted) {

    return (

      <div className="flex h-9 w-9 items-center justify-center">

        <Loader2 className="size-4 animate-spin text-muted-foreground" />

      </div>

    );

  }



  if (!authUser) {

    return (

      <Button asChild size="sm" variant="outline">

        <Link href="/signin">Sign In</Link>

      </Button>

    );

  }



  const displayName = getDisplayName(authUser, profile);



  async function handleSignOut() {

    try {

      await signOut();

      toast.success("Signed out successfully.");

      router.push("/");

      router.refresh();

    } catch {

      toast.error("Failed to sign out.");

    }

  }



  return (

    <div className="flex items-center gap-1">

      <NotificationBell userId={authUser.uid} />

      <DropdownMenu>

      <DropdownMenuTrigger className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">

        <UserAvatar

          authUser={authUser}

          profile={profile}

          className="size-9 border shadow-sm"

        />

      </DropdownMenuTrigger>



      <DropdownMenuContent align="end" className="w-56 *:cursor-pointer">

        <DropdownMenuLabel className="flex items-center gap-3">

          <UserAvatar

            authUser={authUser}

            profile={profile}

            className="size-10 border"

          />

          <div className="min-w-0 flex-1">

            <span className="block truncate font-medium">{displayName}</span>

            <span className="block truncate text-xs font-normal text-muted-foreground">

              {authUser.email}

            </span>

          </div>

        </DropdownMenuLabel>



        <DropdownMenuSeparator />



        {/* Mobile-only quick links — on desktop these live in the header */}

        <DropdownMenuItem asChild className="md:hidden">

          <Link href="/">

            <Home className="mr-2 size-4" />

            Home

          </Link>

        </DropdownMenuItem>



        <DropdownMenuItem asChild className="md:hidden">

          <Link href="/about">

            <Info className="mr-2 size-4" />

            About

          </Link>

        </DropdownMenuItem>



        <DropdownMenuItem asChild className="md:hidden">

          <Link href="/privacy">

            <Lock className="mr-2 size-4" />

            Privacy

          </Link>

        </DropdownMenuItem>



        <DropdownMenuSeparator className="md:hidden" />



        <DropdownMenuItem asChild>

          <Link href="/profile">

            <User2 className="mr-2 size-4" />

            Profile

          </Link>

        </DropdownMenuItem>



        <DropdownMenuItem asChild>

          <Link href="/profile/dashboard">

            <LayoutDashboard className="mr-2 size-4" />

            My Dashboard

          </Link>

        </DropdownMenuItem>



        <DropdownMenuItem asChild>
          <Link href="/favorites">
            <Heart className="mr-2 size-4 fill-current text-red-500" />
            My Favorites
          </Link>
        </DropdownMenuItem>



        <DropdownMenuItem asChild>

          <Link href="/prayer-requests">

            <HeartHandshake className="mr-2 size-4" />

            Prayer Requests

          </Link>

        </DropdownMenuItem>



        <DropdownMenuItem asChild>

          <Link href="/settings">

            <Cog className="mr-2 size-4" />

            Settings

          </Link>

        </DropdownMenuItem>



        {isAdmin ? (

          <DropdownMenuItem asChild>

            <Link href="/admin-panel">

              <Shield className="mr-2 size-4" />

              Admin Panel

            </Link>

          </DropdownMenuItem>

        ) : null}



        <DropdownMenuSub>

          <DropdownMenuSubTrigger>

            <SunMoon className="mr-2 size-4" />

            Theme

          </DropdownMenuSubTrigger>



          <DropdownMenuPortal>

            <DropdownMenuSubContent>

              <DropdownMenuItem

                className="cursor-pointer"

                onSelect={(event) => {

                  event.preventDefault();

                  setTheme("light");

                }}

              >

                <Sun className="mr-2 size-4" />

                Light

              </DropdownMenuItem>



              <DropdownMenuItem

                className="cursor-pointer"

                onSelect={(event) => {

                  event.preventDefault();

                  setTheme("dark");

                }}

              >

                <Moon className="mr-2 size-4" />

                Dark

              </DropdownMenuItem>



              <DropdownMenuItem

                className="cursor-pointer"

                onSelect={(event) => {

                  event.preventDefault();

                  setTheme("system");

                }}

              >

                <Monitor className="mr-2 size-4" />

                System

              </DropdownMenuItem>

            </DropdownMenuSubContent>

          </DropdownMenuPortal>

        </DropdownMenuSub>



        <DropdownMenuSeparator />



        <DropdownMenuItem

          onClick={handleSignOut}

          className="cursor-pointer"

        >

          <LogOut className="mr-2 size-4" />

          Sign Out

        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>

    </div>

  );

}


