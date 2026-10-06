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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;
    if (!USERNAME_REGEX.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username minimal 3 karakter." },
        { status: 400 }
      );
    }

    const existingUsers = await sql`
      SELECT id, username, email FROM users
      WHERE username = ${cleanUsername} OR email = ${cleanEmail}
      LIMIT 1;
    `;

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.email === cleanEmail) {
        return NextResponse.json(
          { 
            error: "Email sudah terdaftar.",
            isEmailRegistered: true,
            registeredEmail: cleanEmail
          },
          { status: 409 }
        );
      }
      if (existing.username === cleanUsername) {
        return NextResponse.json(
          { 
            error: "Username sudah digunakan.",
            isUsernameRegistered: true,
            registeredUsername: cleanUsername
          },
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
