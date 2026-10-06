import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sql, initDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    let session: { id?: number };
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { error: "Format sesi tidak valid." },
        { status: 401 }
      );
    }

    if (!session?.id) {
      return NextResponse.json(
        { error: "ID pengguna tidak ditemukan." },
        { status: 401 }
      );
    }

    await initDatabase();

    const body = await req.json();
    const { name, username, email, phone, address, newPassword } = body;

    if (!name || !username || !email) {
      return NextResponse.json(
        { error: "Nama, username, dan email wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone?.trim() || null;
    const cleanAddress = address?.trim() || null;

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
        { error: "Username minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, atau garis bawah." },
        { status: 400 }
      );
    }

    const usernameCheck = await sql`
      SELECT id FROM users
      WHERE username = ${cleanUsername} AND id != ${session.id}
      LIMIT 1;
    `;

    if (usernameCheck.length > 0) {
      return NextResponse.json(
        { error: "Username sudah digunakan." },
        { status: 409 }
      );
    }

    const emailCheck = await sql`
      SELECT id FROM users
      WHERE email = ${cleanEmail} AND id != ${session.id}
      LIMIT 1;
    `;

    if (emailCheck.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 8) {
        return NextResponse.json(
          { error: "Password minimal 8 karakter." },
          { status: 400 }
        );
      }
    }

    let updatedUsers;

    if (newPassword && newPassword.trim().length >= 8) {
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      updatedUsers = await sql`
        UPDATE users
        SET 
          name = ${cleanName},
          username = ${cleanUsername},
          email = ${cleanEmail},
          phone = ${cleanPhone},
          address = ${cleanAddress},
          password = ${hashedPassword},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${session.id}
        RETURNING id, name, username, email, phone, address, created_at;
      `;
    } else {
      updatedUsers = await sql`
        UPDATE users
        SET 
          name = ${cleanName},
          username = ${cleanUsername},
          email = ${cleanEmail},
          phone = ${cleanPhone},
          address = ${cleanAddress},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${session.id}
        RETURNING id, name, username, email, phone, address, created_at;
      `;
    }

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const updatedUser = updatedUsers[0];

    const response = NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui!",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        createdAt: updatedUser.created_at,
      },
    });

    response.cookies.set("auth_session", JSON.stringify({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: unknown) {
    console.error("Update Profile Error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui profil.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
