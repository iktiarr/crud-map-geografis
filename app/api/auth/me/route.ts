import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, withDbTimeout } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    let session: Record<string, string | number | undefined> | null = null;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ authenticated: false, user: null });
    }

    if (!session?.id) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Fallback data langsung dari verified session cookie
    const fallbackUser = {
      id: session.id,
      name: session.name || "User",
      username: session.username || "user",
      email: session.email || "",
      role: session.role || "user",
      phone: session.phone || "",
      address: session.address || "",
      createdAt: session.createdAt || new Date().toISOString(),
    };

    try {
      // Query database dengan timeout singkat (2500ms) agar respons UI selalu instan
      const users = await withDbTimeout(
        sql`
          SELECT id, name, username, email, role, phone, address, created_at
          FROM users
          WHERE id = ${session.id}
          LIMIT 1;
        `,
        2500
      );

      if (Array.isArray(users) && users.length > 0) {
        const user = users[0];
        return NextResponse.json({
          authenticated: true,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role || "user",
            phone: user.phone,
            address: user.address,
            createdAt: user.created_at,
          },
        });
      }
    } catch {
      console.warn("Notice: Database timeout saat memverifikasi detail user, fallback ke data sesi aktif.");
    }

    // Fallback gracefully jika database sedang cold start / timeout
    return NextResponse.json({
      authenticated: true,
      user: fallbackUser,
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
