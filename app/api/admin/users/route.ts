import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let users;
    if (search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      users = await sql`
        SELECT id, name, username, email, role, phone, address, created_at, updated_at
        FROM users
        WHERE (role = 'user' OR role IS NULL)
          AND email != 'globalmapsstudio.iktiarramadani@web.com'
          AND (LOWER(name) LIKE ${q} OR LOWER(username) LIKE ${q} OR LOWER(email) LIKE ${q} OR LOWER(COALESCE(phone, '')) LIKE ${q})
        ORDER BY id ASC;
      `;
    } else {
      users = await sql`
        SELECT id, name, username, email, role, phone, address, created_at, updated_at
        FROM users
        WHERE (role = 'user' OR role IS NULL)
          AND email != 'globalmapsstudio.iktiarramadani@web.com'
        ORDER BY id ASC;
      `;
    }

    const mappedUsers = (users || []).map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role || "user",
      phone: u.phone || "-",
      address: u.address || "-",
      createdAt: u.created_at,
    }));

    return NextResponse.json({
      success: true,
      users: mappedUsers,
      total: mappedUsers.length,
    });
  } catch (err: unknown) {
    console.error("Admin Users GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar pengguna." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Data permintaan tidak valid." },
        { status: 400 }
      );
    }

    const { name, username, email, password, role, phone, address } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Nama, username, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Cek duplikasi
    const existing = await sql`
      SELECT id FROM users
      WHERE username = ${cleanUsername} OR email = ${cleanEmail}
      LIMIT 1;
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username atau Email sudah terdaftar." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "admin" ? "admin" : "user";

    const result = await sql`
      INSERT INTO users (name, username, email, password, role, phone, address)
      VALUES (
        ${name.trim()},
        ${cleanUsername},
        ${cleanEmail},
        ${hashedPassword},
        ${userRole},
        ${phone ? phone.trim() : null},
        ${address ? address.trim() : null}
      )
      RETURNING id, name, username, email, role, phone, address, created_at;
    `;

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil ditambahkan!",
      user: result[0],
    });
  } catch (err: unknown) {
    console.error("Admin Users POST Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan pengguna." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: "ID pengguna wajib disertakan." },
        { status: 400 }
      );
    }

    const { id, name, role, phone, address, password } = body;

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      await sql`
        UPDATE users
        SET 
          name = COALESCE(${name}, name),
          role = COALESCE(${role}, role),
          phone = COALESCE(${phone}, phone),
          address = COALESCE(${address}, address),
          password = ${hashedPassword},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id};
      `;
    } else {
      await sql`
        UPDATE users
        SET 
          name = COALESCE(${name}, name),
          role = COALESCE(${role}, role),
          phone = COALESCE(${phone}, phone),
          address = COALESCE(${address}, address),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id};
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui!",
    });
  } catch (err: unknown) {
    console.error("Admin Users PUT Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui pengguna." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID pengguna wajib disertakan." },
        { status: 400 }
      );
    }

    // Hindari menghapus admin utama
    const user = await sql`SELECT email, role FROM users WHERE id = ${id} LIMIT 1;`;
    if (user.length > 0 && user[0].email === "globalmapsstudio.iktiarramadani@web.com") {
      return NextResponse.json(
        { success: false, error: "Akun Super Admin utama tidak dapat dihapus." },
        { status: 403 }
      );
    }

    await sql`DELETE FROM users WHERE id = ${id};`;

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus.",
    });
  } catch (err: unknown) {
    console.error("Admin Users DELETE Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus pengguna." },
      { status: 500 }
    );
  }
}
