import { NextResponse } from 'next/server';
import webpush from 'web-push';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function GET() {
  try {
    // Gerçek uygulamada bu bilgiler veritabanından gelecek
    const subscriptions = [
      // Örnek subscription objesi
    ];

    const now = new Date();
    const minutes = now.getMinutes();
    const quarter = Math.floor(minutes / 15) * 15;
    
    const payload = JSON.stringify({
      title: 'Horlog',
      message: `Saat ${now.getHours()}:${quarter.toString().padStart(2, '0')} dilimi başladı!`,
    });

    // Tüm kayıtlı kullanıcılara bildirim gönder
    const notifications = subscriptions.map(subscription =>
      webpush.sendNotification(subscription, payload).catch(error => {
        console.error('Bildirim gönderilemedi:', error);
        // Eğer subscription artık geçerli değilse, veritabanından silinebilir
      })
    );

    await Promise.all(notifications);

    return NextResponse.json({ 
      message: 'Bildirimler gönderildi',
      success: true 
    });
  } catch (error) {
    console.error('Bildirim hatası:', error);
    return NextResponse.json(
      { error: 'Bildirimler gönderilemedi' },
      { status: 500 }
    );
  }
} 