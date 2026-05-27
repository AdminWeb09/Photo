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
  
  // Jika dalam mode simulasi, render banner secara elegan
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
  
  // Inisialisasi ikon Lucide
  lucide.createIcons();
  
  showSpinner(false);
});

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
    
    // Gunakan static placeholder jika gambar error atau tidak valid
    const imageSource = photo.image_url;
    
    card.innerHTML = `
      <div class="gallery-img-container">
        <img src="${imageSource}" alt="${photo.title}" class="gallery-img" loading="lazy">
      </div>
      <div class="gallery-caption">
        <span class="gallery-tag">${escapeHTML(photo.category || 'General')}</span>
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
  
  if (!lightbox) return;

  // Isi data
  lightboxImg.src = photo.image_url;
  lightboxImg.alt = photo.title;
  lightboxTitle.textContent = photo.title;
  lightboxCat.textContent = photo.category || 'General';
  lightboxDesc.textContent = photo.description || 'Tidak ada deskripsi.';
  
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
