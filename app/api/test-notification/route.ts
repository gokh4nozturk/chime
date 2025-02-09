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
    // Tüm aktif subscriptionları getir
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*');

    if (error) throw error;

    if (!subscriptions?.length) {
      return NextResponse.json({ 
        message: 'No active subscriptions found',
        success: false
      });
    }

    const payload = JSON.stringify({
      title: 'Horlog Test',
      message: 'This is a test notification! 🎉',
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
        console.error('Test notification not sent:', error);
        
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
      message: 'Test notifications sent',
      success: true,
      sent_count: notifications.length
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Test notifications not sent' },
      { status: 500 }
    );
  }
} 