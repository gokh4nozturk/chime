'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  useEffect(() => {
    // Service worker'ı register et
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        registration => {
          console.log('Service worker registration succeeded:', registration);
        },
        error => {
          console.log('Service worker registration failed:', error);
        }
      );
    }

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
      console.log('Service Worker Ready:', registration);
      
      // VAPID key'i base64'ten Uint8Array'e çevir
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      console.log('VAPID Public Key:', vapidPublicKey);

      if (!vapidPublicKey) {
        console.error('VAPID key is missing!');
        throw new Error('VAPID public key is not configured');
      }

      function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
      
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
      
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      console.log('Converting VAPID key...');
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      console.log('Converted VAPID key:', convertedVapidKey);
      
      console.log('Requesting push subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('Push Subscription:', subscription);

      // Backend'e subscription bilgisini gönder
      console.log('Sending subscription to backend...');
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed');
      }

      setIsSubscribed(true);
    } catch (error) {
      console.error('Subscription error:', error);
      alert(`Notification permission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#1A237E] text-white">
      <Card className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg border-none">
        <h1 className="text-4xl font-playfair mb-8 text-center">Horlog</h1>
        
        <div className="text-center mb-8">
          <p className="text-6xl font-inter mb-2">{timeUntilNext}</p>
          <p className="text-sm opacity-80">Time until the next 15 minute interval</p>
        </div>

        {!isSubscribed && (
          <Button 
            onClick={subscribeToNotifications}
            className="w-full bg-[#FFD700] text-[#1A237E] hover:bg-[#FFC700]"
          >
            Allow Notifications
          </Button>
        )}

        {isSubscribed && (
          <p className="text-center text-sm opacity-80">
            Notifications are active! I will notify you every 15 minutes.
          </p>
        )}
      </Card>
    </main>
  );
}
