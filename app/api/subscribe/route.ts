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

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    // Subscription bilgisini veritabanına kaydedebilirsiniz
    // Bu örnekte sadece konsola yazdırıyoruz
    console.log('Yeni subscription:', subscription);

    // Test bildirimi gönder
    const payload = JSON.stringify({
      title: 'Horlog',
      message: 'Bildirimler başarıyla aktifleştirildi!',
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ 
      message: 'Subscription başarıyla kaydedildi',
      success: true 
    });
  } catch (error) {
    console.error('Subscription hatası:', error);
    return NextResponse.json(
      { error: 'Subscription kaydedilemedi' },
      { status: 500 }
    );
  }
} 