-- Galleriii Database Schema
-- This migration creates the core tables for the application

-- Create media block type enum
CREATE TYPE media_block_type AS ENUM ('text', 'image', 'gif', 'music', 'video', 'link');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Galleries table
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media blocks table
CREATE TABLE media_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  type media_block_type NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 2),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a gallery has max 3 blocks
  CONSTRAINT unique_gallery_position UNIQUE (gallery_id, position)
);

-- Create indexes for better performance
CREATE INDEX idx_galleries_user_id ON galleries(user_id);
CREATE INDEX idx_galleries_position ON galleries(position);
CREATE INDEX idx_media_blocks_gallery_id ON media_blocks(gallery_id);
CREATE INDEX idx_media_blocks_position ON media_blocks(position);
CREATE INDEX idx_users_username ON users(username);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_blocks_updated_at
  BEFORE UPDATE ON media_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_blocks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read usernames"
  ON users FOR SELECT
  USING (true);

-- Galleries policies
CREATE POLICY "Users can read their own galleries"
  ON galleries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own galleries"
  ON galleries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own galleries"
  ON galleries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own galleries"
  ON galleries FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read visible galleries"
  ON galleries FOR SELECT
  USING (is_hidden = false);

-- Media blocks policies
CREATE POLICY "Users can read their own media blocks"
  ON media_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = media_blocks.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own media blocks"
  ON media_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = media_blocks.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own media blocks"
  ON media_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = media_blocks.gallery_id
      AND galleries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = media_blocks.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own media blocks"
  ON media_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = media_blocks.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read media blocks from visible galleries"
  ON media_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = media_blocks.gallery_id
      AND galleries.is_hidden = false
    )
  );

-- Function to prevent more than 3 blocks per gallery
CREATE OR REPLACE FUNCTION check_max_blocks_per_gallery()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM media_blocks WHERE gallery_id = NEW.gallery_id) >= 3 THEN
    RAISE EXCEPTION 'A gallery can have a maximum of 3 media blocks';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_blocks
  BEFORE INSERT ON media_blocks
  FOR EACH ROW
  EXECUTE FUNCTION check_max_blocks_per_gallery();
