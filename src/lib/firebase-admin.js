import admin from "firebase-admin";

/**
 * Inisialisasi lazy supaya build/import tidak gagal bila env belum diset.
 * Kredensial HANYA dari environment variable — jangan commit file service account.
 */
function getApp() {
  if (admin.apps.length) return admin.apps[0];

  const projectId = process.env.FB_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL;
  const rawKey = process.env.FB_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      "Kredensial Firebase Admin belum lengkap (FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY). Lihat .env.example."
    );
  }

  // Mendukung nilai dengan tanda kutip dan "\n" literal
  const privateKey = rawKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminAuth() {
  return getApp().auth();
}
