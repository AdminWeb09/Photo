/**
 * ==========================================================================
 * SUPABASE PHOTO GALLERY - PUBLIC PAGE LOGIC (gallery.js)
 * Features: Public layout, masonry cards, category filtering, and lightbox.
 * ==========================================================================
 */

// 1. KONFIGURASI SUPABASE (MASUKKAN KREDENSIAL ANDA DI SINI)
const SUPABASE_URL = "https://wjkzhokhgbxzrilfkujm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa3pob2toZ2J4enJpbGZrdWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzcwNzEsImV4cCI6MjA5NTQxMzA3MX0.OCqMVwxjQE3Y4TdUIGSdZu1w6aWEHbrwO6OWnJF3xbc";

// 2. DATA MOCK FALLBACK (Digunakan untuk simulasi jika belum dikonfigurasi)
const MOCK_PHOTOS = [
  {
    id: "mock-1",
    title: "Cahaya Di Balik Kabut",
    description: "Cahaya mentari pagi menembus celah pepohonan pinus berkabut tebal di kawasan pegunungan Lembang, Jawa Barat, melukis siluet mistis nan magis.",
    category: "Nature",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200",
    created_at: "2026-05-20T08:00:00Z"
  },
  {
    id: "mock-2",
    title: "Lembah Padi Priangan",
    description: "Pesona petak-petak sawah hijau bertingkat (terasering) khas Priangan yang berundak indah menemani damainya udara pedesaan Sunda.",
    category: "Landscape",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200",
    created_at: "2026-05-22T09:12:00Z"
  },
  {
    id: "mock-3",
    title: "SCBD Biru Jakarta",
    description: "Kesibukan gedung pencakar langit berarsitektur modern yang bersanding dengan kilau lalu lintas kota di koridor Sudirman Central Business District.",
    category: "Street",
    image_url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1200",
    created_at: "2026-05-24T17:30:00Z"
  },
  {
    id: "mock-4",
    title: "Kerut Tua Nelayan",
    description: "Potret human interest mendalam dari tatapan mata tajam seorang pelaut paruh baya di pesisir utara Jakarta yang sarat akan pengalaman hidup.",
    category: "Portrait",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200",
    created_at: "2026-05-25T11:05:00Z"
  },
  {
    id: "mock-5",
    title: "Lentera Harapan Kota",
    description: "Simpang susun Semanggi yang bermandikan lampu jalanan berkelok artistik melambangkan denyut nadi Jakarta yang tiada pernah sirna.",
    category: "Street",
    image_url: "https://images.unsplash.com/photo-1549643276-fdf2fab574f5?auto=format&fit=crop&q=80&w=1200",
    created_at: "2026-05-26T14:40:00Z"
  },
  {
    id: "mock-6",
    title: "Ketenangan Danau Toska",
    description: "Pantulan langit jernih di permukaan genangan air danau alami dengan gradasi toska berkilau di kelilingi tebing bebatuan karst putih.",
    category: "Nature",
    image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200",
    created_at: "2026-05-26T22:15:00Z"
  }
];

// Instansiasi variabel global
let supabaseClient = null;
let photos = [];
let activeCategory = 'all';
let currentLightboxPhoto = null;

// Cek konfigurasi Supabase
const isConfigured = SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" && SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

if (isConfigured) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error("Gagal menginisialisasi client Supabase:", error);
  }
}

// Inisialisasi Aplikasi Saat Window Dimuat
window.addEventListener('DOMContentLoaded', async () => {
  showSpinner(true);
  
  // Memulai typewriter effect di brand
  initTypewriter();
  
  // Jika dalam mode simulasi, render banner warning secara elegan
  if (!isConfigured) {
    showConfigWarning();
    initMockDatabase();
  }
  
  // Ambil data foto
  await loadPhotos();
  
  // Setup filter kategori
  renderFilters();
  
  // Render foto ke grid
  renderGallery();
  
  // Daftarkan listener event umum
  setupModalEvents();
  setupThemeToggle();
  setupLightboxInteractiveActions();
  
  // Inisialisasi ikon Lucide
  lucide.createIcons();
  
  showSpinner(false);
});

// Efek mesin ketik (typewriter) pada brand logo secara dinamis
function initTypewriter() {
  const brandTitle = document.getElementById('typing-brand');
  if (!brandTitle) return;
  
  const text = 'ZennPhoto';
  let index = 0;
  let isDeleting = false;
  
  // Sisipkan kontainer penampung teks ketikan dan kursor berkedip
  brandTitle.innerHTML = `<span id="typed-text"></span><span class="typed-cursor">|</span>`;
  const typedSpan = document.getElementById('typed-text');
  
  function type() {
    if (!isDeleting) {
      const currentText = text.substring(0, index + 1);
      if (currentText.startsWith('Zenn')) {
        const photoPart = currentText.substring(4);
        typedSpan.innerHTML = `Zenn<span style="color: var(--accent);">${photoPart}</span>`;
      } else {
        typedSpan.innerHTML = currentText;
      }
      
      index++;
      
      if (index === text.length) {
        // Jeda ketika selesai mengetik penuh sebelum menghapus kembali
        setTimeout(() => {
          isDeleting = true;
          type();
        }, 4000);
        return;
      }
    } else {
      const currentText = text.substring(0, index - 1);
      if (currentText.startsWith('Zenn')) {
        const photoPart = currentText.substring(4);
        typedSpan.innerHTML = `Zenn<span style="color: var(--accent);">${photoPart}</span>`;
      } else {
        typedSpan.innerHTML = currentText;
      }
      
      index--;
      
      if (index === 0) {
        isDeleting = false;
        // Jeda pendek sebelum memulai siklus pengetikan ulang
        setTimeout(type, 1500);
        return;
      }
    }
    
    const speed = isDeleting ? 75 : 150;
    setTimeout(type, speed);
  }
  
  // Mulai ketik pertama kali
  setTimeout(type, 1000);
}

// Toast Notification Manager
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'warning') iconName = 'alert-circle';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <div class="toast-message">${message}</div>
    <button class="toast-close" type="button">
      <i data-lucide="x"></i>
    </button>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto expire
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}

// Show/Hide Spinner Overlay
function showSpinner(show) {
  const loader = document.getElementById('loading-overlay');
  if (!loader) return;
  if (show) {
    loader.classList.add('active');
  } else {
    loader.classList.remove('active');
  }
}

// Menampilkan banner edukasi konfigurasi Supabase
function showConfigWarning() {
  const warningBanner = document.createElement('div');
  warningBanner.style.cssText = `
    background: linear-gradient(135deg, #78350f 0%, #451a03 100%);
    border-bottom: 2px solid var(--accent);
    color: var(--text-primary);
    padding: 14px 24px;
    font-size: 0.85rem;
    line-height: 1.5;
    text-align: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  `;
  
  warningBanner.innerHTML = `
    <span style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="info" style="color: var(--accent); width: 18px; height: 18px; flex-shrink: 0;"></i>
      <span><strong>Mode Demonstrasi Aktif:</strong> Web gallery ini berjalan dalam sistem simulasi. Integrasikan database storage Supabase Anda dengan mengganti kredensial di <code>gallery.js</code> dan <code>admin.js</code>.</span>
    </span>
    <button class="btn btn-primary" onclick="this.parentElement.remove()" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 4px;">Pahami</button>
  `;
  document.body.prepend(warningBanner);
}

// Inisialisasi Mock Database lokal di LocalStorage jika tidak terhubung Supabase
function initMockDatabase() {
  const stored = localStorage.getItem('aesthetic_frame_photos');
  if (!stored) {
    localStorage.setItem('aesthetic_frame_photos', JSON.stringify(MOCK_PHOTOS));
  }
}

// Mengambil Data Foto (Dari Supabase atau LocalStorage)
async function loadPhotos() {
  if (isConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      photos = data || [];
    } catch (err) {
      console.error("Gagal mengambil data dari Supabase:", err);
      showToast("Gagal menyinkronkan dengan Supabase. Menggunakan backup simulasi lokal.", "error");
      photos = JSON.parse(localStorage.getItem('aesthetic_frame_photos') || '[]');
    }
  } else {
    // Mode Simulasi Lokal
    photos = JSON.parse(localStorage.getItem('aesthetic_frame_photos') || '[]');
    // Urutkan buatan berdasarkan created_at desc
    photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Lengkapi dengan nilai default statistik jika belum ada entri di db/mock
  photos = photos.map(p => ({
    ...p,
    likes: p.likes || 0,
    views: p.views || 0,
    downloads: p.downloads || 0
  }));
}

// Merender Tombol Filter Kategori Secara Dinamis
function renderFilters() {
  const filterWrapper = document.getElementById('category-filters');
  if (!filterWrapper) return;
  
  // Dapatkan seluruh kategori unik (abaikan spasi & huruf kecil/besar)
  const categories = ['all'];
  photos.forEach(photo => {
    if (photo.category) {
      const formatted = photo.category.trim();
      if (!categories.some(cat => cat.toLowerCase() === formatted.toLowerCase())) {
        categories.push(formatted);
      }
    }
  });

  // Hapus semua tombol kecuali filter awal "all"
  filterWrapper.innerHTML = `<button class="filter-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">Semua Foto</button>`;

  // Tambahkan tombol filter dinamis
  categories.forEach(cat => {
    if (cat.toLowerCase() !== 'all') {
      const btn = document.createElement('button');
      btn.className = `filter-btn ${activeCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`;
      btn.textContent = cat;
      btn.dataset.category = cat;
      filterWrapper.appendChild(btn);
    }
  });

  // Daftarkan event listener klik untuk filter
  const filterButtons = filterWrapper.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Hilangkan class active lama
      filterButtons.forEach(b => b.classList.remove('active'));
      // Tambahkan active ke yang baru klik
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      
      // Filter Grid Foto
      renderGallery();
    });
  });
}

// Merender Item Foto ke Grid Utama
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const emptyState = document.getElementById('empty-gallery');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Saring foto berdasarkan filter kategori
  const filteredPhotos = activeCategory === 'all' 
    ? photos 
    : photos.filter(p => p.category.trim().toLowerCase() === activeCategory.trim().toLowerCase());

  if (filteredPhotos.length === 0) {
    grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  grid.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  filteredPhotos.forEach((photo) => {
    const card = document.createElement('div');
    card.className = 'gallery-item';
    card.dataset.id = photo.id;
    
    // Gunakan static placeholder jika gambar error atau tidak valid
    const imageSource = photo.image_url;
    
    card.innerHTML = `
      <div class="gallery-img-container">
        <img src="${imageSource}" alt="${photo.title}" class="gallery-img" loading="lazy">
      </div>
      <div class="gallery-caption">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="gallery-tag">${escapeHTML(photo.category || 'General')}</span>
        </div>
        <h3 class="gallery-item-title">${escapeHTML(photo.title)}</h3>
        <p class="gallery-item-desc">${escapeHTML(photo.description || '')}</p>
      </div>
    `;
    
    // Lazy load handling dengan fade-in yang menawan
    const img = card.querySelector('.gallery-img');
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
    // Jika di cache browser sudah loaded
    if (img.complete) {
      img.classList.add('loaded');
    }
    
    // On-click event membuka LIGHTBOX
    card.addEventListener('click', () => {
      openLightbox(photo);
    });
    
    grid.appendChild(card);
  });
}

// Lightbox Action Handlers
function openLightbox(photo) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCat = document.getElementById('lightbox-cat');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxDate = document.getElementById('lightbox-date');
  
  const viewsEl = document.getElementById('lightbox-views');
  const likesEl = document.getElementById('lightbox-likes');
  const downloadsEl = document.getElementById('lightbox-downloads');
  
  if (!lightbox) return;

  // Set context foto interaktif aktif saat ini
  currentLightboxPhoto = photo;

  // Isi data
  lightboxImg.src = photo.image_url;
  lightboxImg.alt = photo.title;
  lightboxTitle.textContent = photo.title;
  lightboxCat.textContent = photo.category || 'General';
  lightboxDesc.textContent = photo.description || 'Tidak ada deskripsi.';
  
  // Set statistik terupdate
  if (viewsEl) viewsEl.textContent = photo.views || 0;
  if (likesEl) likesEl.textContent = photo.likes || 0;
  if (downloadsEl) downloadsEl.textContent = photo.downloads || 0;

  // Update tombol like agar menyala atau mati sesuai feedback history browser
  updateLikeBtnState(photo.id);

  // Format tanggal lokalisasi bahasa Indonesia
  try {
    const dateConverted = new Date(photo.created_at);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    lightboxDate.textContent = dateConverted.toLocaleDateString('id-ID', options);
  } catch (err) {
    lightboxDate.textContent = '-';
  }

  // Tampilkan container modal
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden'; // Kunci scroll layar utama
}

// Menambahkan jumlah tayangan/viewer foto
async function incrementPhotoViews(photo) {
  photo.views = (photo.views || 0) + 1;
  
  // Update UI Lightbox & Card Grid secara instant
  const viewsEl = document.getElementById('lightbox-views');
  if (viewsEl) viewsEl.textContent = photo.views;
  
  const card = document.querySelector(`.gallery-item[data-id="${photo.id}"]`);
  if (card) {
    const cardViewsEl = card.querySelector('.card-views-count');
    if (cardViewsEl) cardViewsEl.textContent = photo.views;
  }
  
  // Simpan permanen
  if (isConfigured && supabaseClient) {
    try {
      await supabaseClient
        .from('photos')
        .update({ views: photo.views })
        .eq('id', photo.id);
    } catch (err) {
      console.error("Gagal melakukan sinkronisasi views ke Supabase:", err);
    }
  } else {
    updateLocalPhotoState(photo);
  }
}

// Setup Event Listener Klik untuk Suka dan Unduh di Lightbox
function setupLightboxInteractiveActions() {
  const likeBtn = document.getElementById('lightbox-like-btn');
  const downloadBtn = document.getElementById('lightbox-download-action-btn');
  
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      if (!currentLightboxPhoto) return;
      const photo = currentLightboxPhoto;
      
      const likedPhotos = JSON.parse(localStorage.getItem('liked_photos') || '[]');
      const isAlreadyLiked = likedPhotos.includes(photo.id);
      
      if (isAlreadyLiked) {
        // Batal suka
        photo.likes = Math.max(0, (photo.likes || 0) - 1);
        const updatedLikes = likedPhotos.filter(id => id !== photo.id);
        localStorage.setItem('liked_photos', JSON.stringify(updatedLikes));
        showToast("Batal menyukai foto ini.", "info");
      } else {
        // Suka
        photo.likes = (photo.likes || 0) + 1;
        likedPhotos.push(photo.id);
        localStorage.setItem('liked_photos', JSON.stringify(likedPhotos));
        showToast("Menyukai karya foto ini! ❤️", "success");
      }
      
      // Update UI Lightbox & Grid Card stats secara real-time
      updateLikeBtnState(photo.id);
      const likesEl = document.getElementById('lightbox-likes');
      if (likesEl) likesEl.textContent = photo.likes;
      
      const card = document.querySelector(`.gallery-item[data-id="${photo.id}"]`);
      if (card) {
        const cardLikesEl = card.querySelector('.card-likes-count');
        if (cardLikesEl) cardLikesEl.textContent = photo.likes;
      }
      
      // Persist data
      if (isConfigured && supabaseClient) {
        try {
          await supabaseClient
            .from('photos')
            .update({ likes: photo.likes })
            .eq('id', photo.id);
        } catch (err) {
          console.error("Gagal update suka ke Supabase:", err);
        }
      } else {
        updateLocalPhotoState(photo);
      }
    });
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      if (!currentLightboxPhoto) return;
      const photo = currentLightboxPhoto;
      
      showToast("Sedang memproses unduhan gambar...", "info");
      
      // Tingkatkan data unduhan
      photo.downloads = (photo.downloads || 0) + 1;
      const downloadsEl = document.getElementById('lightbox-downloads');
      if (downloadsEl) downloadsEl.textContent = photo.downloads;
      
      // Trigger download berkas riil dengan layout berbingkai + copyright watermark
      const safeFileName = `${photo.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_')}_framed.jpg`;
      triggerFileDownload(photo.image_url, safeFileName, photo.title);
      
      // Persist data unduhan
      if (isConfigured && supabaseClient) {
        try {
          await supabaseClient
            .from('photos')
            .update({ downloads: photo.downloads })
            .eq('id', photo.id);
        } catch (err) {
          console.error("Gagal simpan unduhan Supabase:", err);
        }
      } else {
        updateLocalPhotoState(photo);
      }
    });
  }
}

// Sinkronkan styling tombol Suka berbasis penyimpanan lokal browser
function updateLikeBtnState(photoId) {
  const likeBtn = document.getElementById('lightbox-like-btn');
  const likeIcon = document.getElementById('lightbox-like-icon');
  const likeText = document.getElementById('lightbox-like-text');
  
  if (!likeBtn) return;
  
  const likedPhotos = JSON.parse(localStorage.getItem('liked_photos') || '[]');
  const isLiked = likedPhotos.includes(photoId);
  
  if (isLiked) {
    likeBtn.classList.add('liked');
    likeBtn.style.color = '#ef4444';
    likeBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    likeBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
    if (likeText) likeText.textContent = 'Disukai';
    if (likeIcon) {
      likeIcon.setAttribute('fill', '#ef4444');
      likeIcon.style.fill = '#ef4444';
    }
  } else {
    likeBtn.classList.remove('liked');
    likeBtn.style.color = '';
    likeBtn.style.borderColor = '';
    likeBtn.style.backgroundColor = '';
    if (likeText) likeText.textContent = 'Suka';
    if (likeIcon) {
      likeIcon.removeAttribute('fill');
      likeIcon.style.fill = '';
    }
  }
}

// Logika download via Blob byte stream agar performa unduh murni & terjamin
async function triggerFileDownload(url, filename, title) {
  try {
    // Muat gambar ke HTMLImageElement untuk pemrosesan canvas
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Tampilkan loading toast sementara memproses
    showToast("Sedang membingkai foto Anda secara estetis...", "info");

    const imgLoadPromise = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error("Gagal memuat gambar untuk dirender ke bingkai"));
    });
    
    img.src = url;
    await imgLoadPromise;
    
    // Hitung proporsi bingkai berkelas
    const W = img.width;
    const H = img.height;
    const maxDim = Math.max(W, H);
    
    // Parameter desain bingkai galeri seni mewah
    const borderOuter = Math.round(maxDim * 0.05); // Margin luar kertas 5%
    const borderBottom = Math.round(maxDim * 0.12); // Margin bawah 12% untuk letak teks info
    const borderInnerGap = Math.round(maxDim * 0.015); // Celah kertas halus antara garis seni dan foto
    const thinStroke = Math.round(maxDim * 0.002) || 1; // Garis tinta tipis pembatas
    
    // Ukuran canvas total
    const canvas = document.createElement('canvas');
    canvas.width = W + (borderOuter * 2) + (borderInnerGap * 2);
    canvas.height = H + borderOuter + borderBottom + (borderInnerGap * 2);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Gagal membuat konteks grafik canvas");
    
    // 1. Gambar latar belakang kertas serat halus galeri (Off-White hangat premium)
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Gambar garis pembatas seni halus (Aesthetic Fine Art Line)
    ctx.strokeStyle = '#d4cfb8'; // Warna krem abu-abu hangat klasik
    ctx.lineWidth = thinStroke;
    ctx.strokeRect(
      borderOuter,
      borderOuter,
      W + borderInnerGap * 2,
      H + borderInnerGap * 2
    );
    
    // 3. Gambar foto asli dengan presisi
    ctx.drawImage(
      img,
      borderOuter + borderInnerGap,
      borderOuter + borderInnerGap,
      W,
      H
    );
    
    // 4. Susun Desain Tipografi Hak Cipta di Bawah Foto
    // A. Judul Foto: Gaya Serif Italic Klasik
    const titleSize = Math.max(16, Math.round(maxDim * 0.026));
    ctx.fillStyle = '#1e293b'; // Slate dark gray
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = `italic 600 ${titleSize}px Georgia, "Playfair Display", Times, serif`;
    const textY = H + borderOuter + borderInnerGap * 2 + Math.round(borderBottom * 0.35);
    ctx.fillText(title || 'Abadikan Momen', canvas.width / 2, textY);
    
    // B. Ornamen pembatas minimalist di tengah
    const dividerSize = Math.max(11, Math.round(maxDim * 0.015));
    ctx.font = `${dividerSize}px Georgia, serif`;
    ctx.fillStyle = '#d97706'; // Warna aksen kuning safron
    ctx.fillText('❖', canvas.width / 2, textY + Math.round(borderBottom * 0.22));
    
    // C. Hak Cipta: Font Monospace spasi tegas 'by ZennPhoto'
    const copyrightSize = Math.max(10, Math.round(maxDim * 0.014));
    ctx.font = `400 ${copyrightSize}px "Courier New", Courier, monospace`;
    ctx.fillStyle = '#64748b'; // Muted slate gray
    ctx.fillText('by ZennPhoto', canvas.width / 2, textY + Math.round(borderBottom * 0.45));
    
    // 5. Konversi canvas ke file JPEG beresolusi tinggi (kualitas 95%)
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("Gagal mengonversi kanvas ke berkas gambar");
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      showToast("Foto berhasil diunduh dengan Bingkai Estetis ZennPhoto!", "success");
    }, 'image/jpeg', 0.95);
    
  } catch (err) {
    console.warn("Kebijakan batasan CORS atau kendala sistem terdeteksi dalam membingkai foto. Mengalirkan unduhan mentah langsung...", err);
    await triggerRawFileDownload(url, filename);
  }
}

// Mengunduh foto murni secara fallback jika browser melarang manipulasi canvas (CORS)
async function triggerRawFileDownload(url, filename) {
  try {
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Foto berhasil diunduh!", "success");
      return;
    }

    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    showToast("Foto berhasil diunduh!", "success");
  } catch (err) {
    console.warn("Gagal melakukan unduhan langsung, mengalihkan ke tab baru...", err);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
    showToast("Membuka foto di tab baru. Silakan klik kanan pilih Simpan Gambar.", "success");
  }
}

// Helper memperbarui entri database simulasi lokal
function updateLocalPhotoState(updatedPhoto) {
  const localPhotos = JSON.parse(localStorage.getItem('aesthetic_frame_photos') || '[]');
  const index = localPhotos.findIndex(p => p.id === updatedPhoto.id);
  if (index !== -1) {
    localPhotos[index] = { ...localPhotos[index], ...updatedPhoto };
    localStorage.setItem('aesthetic_frame_photos', JSON.stringify(localPhotos));
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = ''; // Aktifkan scroll lancar kembali
  
  // Hapus source gambar setelah tertutup agar saat buka yang baru tidak flicker
  setTimeout(() => {
    document.getElementById('lightbox-img').src = '';
  }, 300);
}

function setupModalEvents() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }
  
  // Klik di luar visual konten modal untuk menutup
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-media')) {
        closeLightbox();
      }
    });
  }
  
  // Tutup bermodalkan tombol keyboard ESCAPE
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });
}

// Sanitasi String HTML Untuk Keamanan XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Fitur Ganti Tema (Terang / Gelap)
function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  
  const isLight = document.documentElement.classList.contains('light-theme');
  updateThemeIcon(isLight);
  
  toggleBtn.addEventListener('click', () => {
    const currentlyLight = document.documentElement.classList.contains('light-theme');
    if (currentlyLight) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
      updateThemeIcon(false);
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      updateThemeIcon(true);
    }
  });
}

function updateThemeIcon(isLight) {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  const icon = toggleBtn.querySelector('i') || toggleBtn.querySelector('svg');
  if (icon) {
    if (isLight) {
      icon.setAttribute('data-lucide', 'moon');
    } else {
      icon.setAttribute('data-lucide', 'sun');
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}
