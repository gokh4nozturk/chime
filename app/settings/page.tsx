'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const router = useRouter();
  const [startHour, setStartHour] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(24);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('preferences')
        .single();

      if (subscriptions?.preferences) {
        const { start_hour, end_hour, sound_enabled, vibration_enabled } = subscriptions.preferences;
        setStartHour(start_hour);
        setEndHour(end_hour);
        setSoundEnabled(sound_enabled);
        setVibrationEnabled(vibration_enabled);
      }
    } catch (error) {
      console.error('Tercihler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      await supabase
        .from('subscriptions')
        .update({
          preferences: {
            start_hour: startHour,
            end_hour: endHour,
            sound_enabled: soundEnabled,
            vibration_enabled: vibrationEnabled,
          }
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      router.push('/');
    } catch (error) {
      console.error('Tercihler kaydedilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#1A237E] text-white">
        <div className="w-full max-w-md text-center">
          Yükleniyor...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#1A237E] text-white">
      <Card className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg border-none space-y-8">
        <h1 className="text-2xl font-playfair mb-8 text-center">Bildirim Ayarları</h1>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Bildirim Saatleri</Label>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Başlangıç: {startHour}:00</span>
                <span>Bitiş: {endHour}:00</span>
              </div>
              <div className="flex gap-4">
                <Slider
                  value={[startHour]}
                  onValueChange={(values: number[]) => setStartHour(values[0])}
                  max={24}
                  step={1}
                  className="flex-1"
                />
                <Slider
                  value={[endHour]}
                  onValueChange={(values: number[]) => setEndHour(values[0])}
                  max={24}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound">Bildirim Sesi</Label>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="vibration">Titreşim</Label>
            <Switch
              id="vibration"
              checked={vibrationEnabled}
              onCheckedChange={setVibrationEnabled}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="flex-1 bg-white/5 hover:bg-white/10"
          >
            İptal
          </Button>
          <Button
            onClick={savePreferences}
            className="flex-1 bg-[#FFD700] text-[#1A237E] hover:bg-[#FFC700]"
          >
            Kaydet
          </Button>
        </div>
      </Card>
    </main>
  );
} 