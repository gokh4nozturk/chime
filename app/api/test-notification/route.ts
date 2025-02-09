import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '@/lib/supabase';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function GET() {
  try {
    // Tüm aktif subscriptionları getir
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*');

    if (error) throw error;

    if (!subscriptions?.length) {
      return NextResponse.json({ 
        message: 'Henüz kayıtlı subscription yok',
        success: false
      });
    }

    const payload = JSON.stringify({
      title: 'Horlog Test',
      message: 'Bu bir test bildirimidir! 🎉',
    });

    // Tüm kayıtlı kullanıcılara test bildirimi gönder
    const notifications = (subscriptions as Subscription[]).map(sub => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      return webpush.sendNotification(subscription, payload).catch(async error => {
        console.error('Test bildirimi gönderilemedi:', error);
        
        if (error.statusCode === 410) {
          await supabase
            .from('subscriptions')
            .delete()
            .match({ id: sub.id });
        }
      });
    });

    await Promise.all(notifications);

    return NextResponse.json({ 
      message: 'Test bildirimleri gönderildi',
      success: true,
      sent_count: notifications.length
    });
  } catch (error) {
    console.error('Test bildirim hatası:', error);
    return NextResponse.json(
      { error: 'Test bildirimleri gönderilemedi' },
      { status: 500 }
    );
  }
} 