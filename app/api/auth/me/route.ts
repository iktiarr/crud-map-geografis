import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const session = JSON.parse(sessionCookie.value);
    if (!session?.id) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    await initDatabase();

    const users = await sql`
      SELECT id, name, username, email, phone, address, created_at
      FROM users
      WHERE id = ${session.id}
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = users[0];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
