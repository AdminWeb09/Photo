-- SQL Setup untuk Database Supabase Galeri Foto Modern
-- Jalankan query di bawah ini di SQL Editor di dashboard Supabase Anda.

-- ==========================================
-- 1. PEMBUATAN TABEL PHOTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT NOT NULL, -- URL langsung ke image di Supabase Storage
    file_path TEXT NOT NULL, -- path relatif file di bucket
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. ENABLING ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. PEMBUATAN POLICY UNTUK TABEL PHOTOS
-- ==========================================

-- Policy: Siapa saja (Anon & Auth) bisa melihat foto
DROP POLICY IF EXISTS "Allow public read access on photos" ON public.photos;
CREATE POLICY "Allow public read access on photos" 
ON public.photos FOR SELECT 
TO public 
USING (true);

-- Policy: Hanya user yang login (Authenticated saja) yang bisa insert foto baru
DROP POLICY IF EXISTS "Allow authenticated insert on photos" ON public.photos;
CREATE POLICY "Allow authenticated insert on photos" 
ON public.photos FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Hanya user yang login (Authenticated saja) yang bisa update data foto
DROP POLICY IF EXISTS "Allow authenticated update on photos" ON public.photos;
CREATE POLICY "Allow authenticated update on photos" 
ON public.photos FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy: Hanya user yang login (Authenticated saja) yang bisa hapus foto
DROP POLICY IF EXISTS "Allow authenticated delete on photos" ON public.photos;
CREATE POLICY "Allow authenticated delete on photos" 
ON public.photos FOR DELETE 
TO authenticated 
USING (true);


-- ==========================================
-- 4. SETUP STORAGE BUCKET "gallery-images"
-- ==========================================

-- Pastikan bucket storage telah ada dengan akses publik
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 5. PEMBUATAN POLICY UNTUK STORAGE
-- ==========================================

-- Policy: Siapa saja bisa membaca (download) gambar dari bucket "gallery-images"
DROP POLICY IF EXISTS "Allow public read access on storage" ON storage.objects;
CREATE POLICY "Allow public read access on storage"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-images');

-- Policy: Hanya user login yang bisa upload gambar ke bucket "gallery-images"
DROP POLICY IF EXISTS "Allow authenticated uploads on storage" ON storage.objects;
CREATE POLICY "Allow authenticated uploads on storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery-images');

-- Policy: Hanya user login yang bisa update gambar di bucket "gallery-images"
DROP POLICY IF EXISTS "Allow authenticated updates on storage" ON storage.objects;
CREATE POLICY "Allow authenticated updates on storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery-images')
WITH CHECK (bucket_id = 'gallery-images');

-- Policy: Hanya user login yang bisa menghapus gambar dari bucket "gallery-images"
DROP POLICY IF EXISTS "Allow authenticated deletions on storage" ON storage.objects;
CREATE POLICY "Allow authenticated deletions on storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery-images');
