import { FieldValue } from "firebase-admin/firestore";

import { getAuth } from "firebase-admin/auth";

import { NextResponse } from "next/server";



import { triggerWelcomeEmails } from "@/lib/email/triggers";

import { getAdminApp, getAdminDb } from "@/lib/firebase-admin";

import { DEFAULT_EMAIL_PREFERENCES } from "@/lib/email/preferences";

import {
  getChurchesByOrganization,
  getOrganizationById,
  getOrganizationsForUser,
} from "@/lib/organization/organization-server";
import { getWorkspaceType } from "@/lib/organization/workspace-type";



type SyncProfileBody = {

  firstName?: string;

  lastName?: string;

};



export async function POST(request: Request) {

  const adminApp = getAdminApp();

  const adminDb = getAdminDb();



  if (!adminApp || !adminDb) {

    return NextResponse.json(

      { error: "Firebase Admin is not configured on the server." },

      { status: 503 }

    );

  }



  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  }



  const idToken = authHeader.slice("Bearer ".length);



  let uid: string;

  let email: string | undefined;

  let displayName: string | undefined;



  try {

    const decoded = await getAuth(adminApp).verifyIdToken(idToken);

    uid = decoded.uid;

    email = decoded.email;

    displayName = decoded.name;

  } catch {

    return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  }



  let body: SyncProfileBody = {};

  try {

    body = (await request.json()) as SyncProfileBody;

  } catch {

    body = {};

  }



  const userRef = adminDb.collection("users").doc(uid);

  const existing = await userRef.get();



  if (!existing.exists) {

    const nameParts = (displayName ?? "").split(" ");

    const firstName = body.firstName?.trim() || nameParts[0] || "";

    const lastName =

      body.lastName?.trim() || nameParts.slice(1).join(" ") || "";



    await userRef.set({

      firstName,

      lastName,

      email: email ?? "",

      role: "user" as const,

      emailPreferences: DEFAULT_EMAIL_PREFERENCES,

      needsChurchOnboarding: true,

      createdAt: FieldValue.serverTimestamp(),

    });



    if (email?.trim()) {

      triggerWelcomeEmails({

        email: email.trim(),

        firstName,

        lastName,

        userId: uid,

      });

    }



    return NextResponse.json({

      firstName,

      lastName,

      email: email ?? "",

      role: "user",

      needsChurchOnboarding: true,

      createdAt: null,

    });

  }



  const data = existing.data()!;



  const orgs = await getOrganizationsForUser(uid);

  const organizationId = orgs[0]?.id ?? null;



  let needsChurchOnboarding = data.needsChurchOnboarding === true;

  if (organizationId) {
    const organization = await getOrganizationById(organizationId);
    const workspaceType = getWorkspaceType(organization);

    if (workspaceType === "multi_church_org") {
      needsChurchOnboarding = data.needsChurchOnboarding === true;
    } else if (data.needsChurchOnboarding === false) {
      needsChurchOnboarding = false;
    } else {
      const churches = await getChurchesByOrganization(organizationId);
      needsChurchOnboarding = churches.length === 0;
    }
  } else if (!data.churchId) {

    needsChurchOnboarding = true;

  }



  return NextResponse.json({

    firstName: String(data.firstName ?? ""),

    lastName: String(data.lastName ?? ""),

    email: String(data.email ?? ""),

    role: data.role ?? "user",

    organizationId,

    needsChurchOnboarding,

    churchId: data.churchId ?? null,

    activeBranchId: data.activeBranchId ?? null,

    churchRole: data.churchRole ?? null,

    managedChurchIds: data.managedChurchIds ?? [],

    createdAt: data.createdAt ?? null,

  });

}

