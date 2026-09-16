import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDatabase();

    const body = await req.json();
    const { name, username, email, password, phone, address } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: "Nama, username, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUsers = await sql`
      SELECT id, username, email FROM users
      WHERE username = ${cleanUsername} OR email = ${cleanEmail}
      LIMIT 1;
    `;

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.username === cleanUsername) {
        return NextResponse.json(
          { error: "Username sudah digunakan oleh akun lain." },
          { status: 409 }
        );
      }
      if (existing.email === cleanEmail) {
        return NextResponse.json(
          { error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk." },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertedUsers = await sql`
      INSERT INTO users (name, username, email, password, phone, address)
      VALUES (${name.trim()}, ${cleanUsername}, ${cleanEmail}, ${hashedPassword}, ${phone?.trim() || null}, ${address?.trim() || null})
      RETURNING id, name, username, email, phone, address, created_at;
    `;

    const newUser = insertedUsers[0];

    const response = NextResponse.json({
      success: true,
      message: "Pendaftaran akun berhasil!",
      user: newUser,
    });

    response.cookies.set("auth_session", JSON.stringify({
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: unknown) {
    console.error("Register Error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat pendaftaran.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
