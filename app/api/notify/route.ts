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

    // Aktif cron jobları getir
    const { data: cronJobs, error: cronError } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('is_active', true)
      .eq('hour', currentHour)
      .eq('minute', quarter);

    if (cronError) throw cronError;

    if (!cronJobs || cronJobs.length === 0) {
      return NextResponse.json({ 
        message: 'No active cron jobs found for this time',
        success: true,
        sent_count: 0
      });
    }

    // Aktif subscriptionları getir
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .gte('preferences->start_hour', currentHour)
      .lte('preferences->end_hour', currentHour);

    if (error) throw error;

    const payload = JSON.stringify({
      title: 'Horlog',
      message: `Hour ${now.getHours()}:${quarter.toString().padStart(2, '0')} interval started!`,
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

    // Cron job çalışma kaydını güncelle
    await supabase
      .from('cron_jobs')
      .update({ 
        last_run: new Date().toISOString(),
        run_count: cronJobs[0].run_count + 1 || 1
      })
      .eq('id', cronJobs[0].id);

    return NextResponse.json({ 
      message: 'Notifications sent',
      success: true,
      sent_count: notifications.length
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Notifications not sent' },
      { status: 500 }
    );
  }
} 