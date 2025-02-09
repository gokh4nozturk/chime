'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  useEffect(() => {
    // Service worker'ı kontrol et
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    }

    // Her saniye kalan süreyi güncelle
    const interval = setInterval(() => {
      const now = new Date();
      const minutes = now.getMinutes();
      const nextQuarter = Math.ceil(minutes / 15) * 15;
      const minutesUntilNext = nextQuarter - minutes;
      const seconds = 60 - now.getSeconds();
      
      setTimeUntilNext(`${minutesUntilNext - 1}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const subscribeToNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Backend'e subscription bilgisini gönder
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      setIsSubscribed(true);
    } catch (error) {
      console.error('Bildirim izni alınamadı:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#1A237E] text-white">
      <Card className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg border-none">
        <h1 className="text-4xl font-playfair mb-8 text-center">Horlog</h1>
        
        <div className="text-center mb-8">
          <p className="text-6xl font-inter mb-2">{timeUntilNext}</p>
          <p className="text-sm opacity-80">Bir sonraki 15 dakikalık dilime kalan süre</p>
        </div>

        {!isSubscribed && (
          <Button 
            onClick={subscribeToNotifications}
            className="w-full bg-[#FFD700] text-[#1A237E] hover:bg-[#FFC700]"
          >
            Bildirimleri Aç
          </Button>
        )}

        {isSubscribed && (
          <p className="text-center text-sm opacity-80">
            Bildirimler aktif! Her 15 dakikada bir sizi uyaracağım.
          </p>
        )}
      </Card>
    </main>
  );
}
