import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '@/lib/supabase';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

webpush.setVapidDetails(
  'mailto:horlog@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function GET() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const minutes = now.getMinutes();
    const quarter = Math.floor(minutes / 15) * 15;

    // Aktif subscriptionları getir
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .gte('preferences->start_hour', currentHour)
      .lte('preferences->end_hour', currentHour);

    if (error) throw error;

    if (!subscriptions?.length) {
      return NextResponse.json({ 
        message: 'No active subscriptions found',
        success: false,
        current_time: `${currentHour}:${quarter}`
      });
    }

    const timeEmoji = getTimeEmoji(currentHour);
    const payload = JSON.stringify({
      title: 'Horlog',
      message: `${timeEmoji} Saat ${currentHour.toString().padStart(2, '0')}:${quarter.toString().padStart(2, '0')} periyodu başladı!`,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      timestamp: now.getTime(),
      vibrate: [200, 100, 200],
      tag: 'horlog-notification',
      actions: [
        {
          action: 'open',
          title: 'Uygulamayı Aç'
        }
      ]
    });

    // Tüm kayıtlı kullanıcılara bildirim gönder
    const notifications = (subscriptions as Subscription[]).map(sub => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      return webpush.sendNotification(subscription, payload).catch(async error => {
        console.error('Notification not sent:', error);
        
        if (error.statusCode === 410) {
          // Subscription artık geçerli değil, veritabanından sil
          await supabase
            .from('subscriptions')
            .delete()
            .match({ id: sub.id });
        }
      });
    });

    await Promise.all(notifications);

    return NextResponse.json({ 
      message: 'Notifications sent',
      success: true,
      sent_count: notifications.length,
      current_time: `${currentHour}:${quarter}`
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Notifications not sent' },
      { status: 500 }
    );
  }
}

function getTimeEmoji(hour: number): string {
  if (hour >= 6 && hour < 12) return '🌅';
  if (hour >= 12 && hour < 18) return '☀️';
  if (hour >= 18 && hour < 22) return '��';
  return '🌙';
} 