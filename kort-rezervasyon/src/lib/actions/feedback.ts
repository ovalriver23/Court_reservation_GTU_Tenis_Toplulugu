"use server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FEEDBACK_RECIPIENTS = [
  "tuanaak45@gmail.com", // TODO: değiştir 
];

export async function sendFeedback(message: string, senderName: string) {
  if (!message.trim()) return { error: "Mesaj boş olamaz." };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GTU Tenis <noreply@gtutennis.com.tr>",
      to: FEEDBACK_RECIPIENTS,
      subject: "Yeni Geri Bildirim — GTU Tenis",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: #A3472E; padding: 24px 32px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Yeni Geri Bildirim</h2>
            <p style="color: #ffffff99; margin: 4px 0 0; font-size: 13px;">GTU Tenis · ${new Date().toLocaleString("tr-TR")}</p>
          </div>
          <div style="padding: 28px 32px;">
            <p style="color: #aaaaaa; font-size: 13px; margin: 0 0 8px;">Gönderen: <span style="color: #ffffff;">${senderName}</span></p>
            <p style="color: #ffffff; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="border-top: 1px solid #333; padding: 14px 32px;">
            <p style="color: #444444; font-size: 11px; margin: 0;">GTU Tenis Topluluğu · gtutennis.com.tr</p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) return { error: "Gönderim başarısız. Lütfen tekrar dene." };
  return { success: true };
}
