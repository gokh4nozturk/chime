-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  preferences JSONB DEFAULT '{"start_hour": 0, "end_hour": 24, "sound_enabled": true, "vibration_enabled": true}'::jsonb NOT NULL,
  last_notification TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_preferences ON subscriptions USING gin(preferences);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for users" ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users" ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users" ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users" ON subscriptions FOR DELETE
  USING (auth.uid() = user_id); 