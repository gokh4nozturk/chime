import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

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
    const userId = cookies().get('user_id')?.value || uuidv4();

    // Yeni kullanıcı ise cookie oluştur
    if (!cookies().get('user_id')) {
      cookies().set('user_id', userId);
    }

    // Subscription'ı veritabanına kaydet
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        id: uuidv4(),
        user_id: userId,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
        preferences: {
          start_hour: 0,
          end_hour: 24,
          sound_enabled: true,
          vibration_enabled: true,
        },
      });

    if (error) throw error;

    // Test bildirimi gönder
    const payload = JSON.stringify({
      title: 'Horlog',
      message: 'Bildirimler başarıyla aktifleştirildi!',
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ 
      message: 'Subscription başarıyla kaydedildi',
      success: true,
      user_id: userId
    });
  } catch (error) {
    console.error('Subscription hatası:', error);
    return NextResponse.json(
      { error: 'Subscription kaydedilemedi' },
      { status: 500 }
    );
  }
} 