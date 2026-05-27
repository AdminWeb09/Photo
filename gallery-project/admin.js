/**
 * ==========================================================================
 * SUPABASE PHOTO GALLERY - ADMIN CORE LOGIC (admin.js)
 * Features: Dual-state Auth controller, Drag-and-Drop Uploader, Edit/Delete Engine.
 * ==========================================================================
 */

// 1. KONFIGURASI SUPABASE (SAMUKAN KREDENSIAL YANG SAMA)
const SUPABASE_URL = "https://wjkzhokhgbxzrilfkujm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa3pob2toZ2J4enJpbGZrdWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzcwNzEsImV4cCI6MjA5NTQxMzA3MX0.OCqMVwxjQE3Y4TdUIGSdZu1w6aWEHbrwO6OWnJF3xbc";

// Inisialisasi variabel global
let supabaseClient = null;
let currentPhotos = [];
let selectedUploadFile = null;

// Cek konfigurasi Supabase
const isConfigured = SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" && SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

if (isConfigured) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error("Gagal menginisialisasi client Supabase di Admin:", error);
  }
}

// Inisialisasi Saat Halaman Dimuat
window.addEventListener('DOMContentLoaded', async () => {
  showSpinner(true);
  
  // Jika dalam mode simulasi, render banner warning secara elegan
  if (!isConfigured) {
    showConfigWarning();
  }

  // Cek Status Autentikasi
  const sessionActive = await checkAuthSession();
  
  if (sessionActive) {
    await initDashboard();
  } else {
    // Tampilkan panel Login
    showAuthScreen(true);
    showSpinner(false);
  }
  
  // Daftarkan event-event handler form & UI
  setupDashboardEvents();
  setupUploadDragAndDrop();
  setupThemeToggle();
  
  // Inisialisasi ikon Lucide
  lucide.createIcons();
});

// Toast Notification Manager
function showToast(message, type = 'info') {
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

// Tampilkan Banner Simulasi
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
    width: 100%;
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
      <span><strong>Mode Demonstrasi Panel Admin:</strong> Gunakan email/password apa pun untuk masuk (contoh: <code>admin@gallery.com</code> & <code>admin123</code>).</span>
    </span>
    <button class="btn btn-primary" onclick="this.parentElement.remove()" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 4px;">Pahami</button>
  `;
  // Menempelkan paling atas body
  document.body.prepend(warningBanner);
}

// Mengecek Status Login Sesi
async function checkAuthSession() {
  if (isConfigured && supabaseClient) {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      return !!session;
    } catch (err) {
      console.error("Gagal memeriksa sesi Supabase:", err);
      return false;
    }
  } else {
    // Mode Simulasi Lokal
    return localStorage.getItem('aesthetic_frame_admin_logged_in') === 'true';
  }
}

// Pengaturan Tampilan Autentikasi vs Dashboard
function showAuthScreen(show) {
  const authSection = document.getElementById('auth-section');
  const dashboardSection = document.getElementById('admin-dashboard');
  
  if (show) {
    if (authSection) authSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
    document.title = "Masuk - ZennPhoto Admin";
  } else {
    if (authSection) authSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'grid';
    document.title = "Dashboard - ZennPhoto Admin";
  }
}

// Inisialisasi Dashboard Admin Setelah Terautentikasi
async function initDashboard() {
  showSpinner(true);
  showAuthScreen(false);
  
  // Ambil list foto terbaru
  await fetchPhotos();
  
  // Render list foto ke dashboard manajemen
  renderAdminTable();
  
  showSpinner(false);
}

// Menarik Seluruh Data Foto
async function fetchPhotos() {
  if (isConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      currentPhotos = data || [];
    } catch (err) {
      console.error("Gagal mengambil data database:", err);
      showToast("Gagal menyambung database Supabase. Mengambil data cadangan lokal.", "error");
      currentPhotos = JSON.parse(localStorage.getItem('aesthetic_frame_photos') || '[]');
    }
  } else {
    // Mode Simulasi Lokal
    const stored = localStorage.getItem('aesthetic_frame_photos');
    currentPhotos = stored ? JSON.parse(stored) : [];
    // Urutkan data descending
    currentPhotos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

// Render data foto ke Card Grid di Admin Tab
function renderAdminTable() {
  const grid = document.getElementById('admin-photo-grid');
  const emptyState = document.getElementById('admin-empty-gallery');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (currentPhotos.length === 0) {
    grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  if (emptyState) emptyState.style.display = 'none';

  currentPhotos.forEach((photo) => {
    const card = document.createElement('div');
    card.className = 'admin-photo-card';
    
    // Format Tanggal
    let formattedDate = '-';
    try {
      formattedDate = new Date(photo.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {}

    card.innerHTML = `
      <img src="${photo.image_url}" alt="${photo.title}" class="admin-photo-thumbnail">
      <div class="admin-photo-details">
        <div class="admin-photo-meta">
          <span style="color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 0.75rem;">${escapeHTML(photo.category || 'General')}</span>
          <span>${formattedDate}</span>
        </div>
        <h3 class="admin-photo-title">${escapeHTML(photo.title)}</h3>
        <p class="admin-photo-desc">${escapeHTML(photo.description || '')}</p>
        <div class="admin-photo-actions">
          <button class="btn btn-secondary btn-edit-photo" data-id="${photo.id}">
            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Edit
          </button>
          <button class="btn btn-danger btn-delete-photo" data-id="${photo.id}">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Hapus
          </button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  // Daftarkan event listener tombol aksi Edit & Delete
  grid.querySelectorAll('.btn-edit-photo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      openEditModal(id);
    });
  });

  grid.querySelectorAll('.btn-delete-photo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      handleDeletePhoto(id);
    });
  });

  lucide.createIcons();
}

// Event Listeners Dasar Admin Panel
function setupDashboardEvents() {
  // 1. Submit Handshake LOGIN FORM
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showSpinner(true);
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      if (isConfigured && supabaseClient) {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          showToast(`Selamat datang kembali, ${data.user.email}!`, 'success');
          await initDashboard();
        } catch (err) {
          console.error("Gagal Login:", err);
          showToast(err.message || 'Email atau password salah!', 'error');
          showSpinner(false);
        }
      } else {
        // Mode Simulasi Auth
        localStorage.setItem('aesthetic_frame_admin_logged_in', 'true');
        showToast("Login Berhasil (Mode Simulasi)!", "success");
        await initDashboard();
      }
    });
  }

  // 2. LOGOUT Button Click
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      showSpinner(true);
      if (isConfigured && supabaseClient) {
        try {
          const { error } = await supabaseClient.auth.signOut();
          if (error) throw error;
        } catch (e) {
          console.error("Kesalahan saat Sign Out Supabase:", e);
        }
      }
      localStorage.removeItem('aesthetic_frame_admin_logged_in');
      showToast("Sesi Anda telah berakhir.", "info");
      
      // Kosongkan state data sensitif
      currentPhotos = [];
      showAuthScreen(true);
      showSpinner(false);
    });
  }

  // 3. Tab Navigation Switches
  const navItems = document.querySelectorAll('.nav-item[data-target]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetScreenId = item.getAttribute('data-target');
      
      // Ganti class Active di navigasi menu sidebar
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      // Sembunyikan semua screen, tampilkan yang dituju
      document.querySelectorAll('.admin-section').forEach(screen => {
        screen.classList.remove('active');
      });
      const targetScreen = document.getElementById(targetScreenId);
      if (targetScreen) targetScreen.classList.add('active');
    });
  });

  // Tambah Baru Shortcut button
  const triggerUploadTabBtn = document.getElementById('btn-trigger-upload-tab');
  const emptyUploadBtn = document.getElementById('admin-btn-empty-upload');
  
  const activateUploadTab = () => {
    const navUpload = document.getElementById('nav-upload');
    if (navUpload) navUpload.click();
  };
  
  if (triggerUploadTabBtn) triggerUploadTabBtn.addEventListener('click', activateUploadTab);
  if (emptyUploadBtn) emptyUploadBtn.addEventListener('click', activateUploadTab);

  // 4. SUBMIT FORM UPLOAD FOTO
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('photo-title').value;
      const category = document.getElementById('photo-category').value;
      const description = document.getElementById('photo-description').value;
      
      if (!selectedUploadFile) {
        showToast("Harap pilih file gambar terlebih dahulu!", "warning");
        return;
      }
      
      showSpinner(true);
      
      try {
        if (isConfigured && supabaseClient) {
          // Upload Asli ke Supabase Storage & Database
          
          // Generate nama file unik ramah URL
          const fileExtension = selectedUploadFile.name.split('.').pop();
          const cleanFileName = `photo_${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExtension}`;
          const filePath = cleanFileName;
          
          // Upload ke Bucket Storage
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('gallery-images')
            .upload(filePath, selectedUploadFile, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (uploadError) throw uploadError;
          
          // Dapatkan URL Publik gambar
          const { data: { publicUrl } } = supabaseClient.storage
            .from('gallery-images')
            .getPublicUrl(filePath);
            
          // Simpan rekam data di Tabel Database photos
          const { error: dbError } = await supabaseClient
            .from('photos')
            .insert({
              title,
              category,
              description,
              image_url: publicUrl,
              file_path: filePath
            });
            
          if (dbError) throw dbError;
          
          showToast("Karya foto berhasil terupload dan terpublikasikan ke galeri!", "success");
        } else {
          // Simulasi Ingestion Lokal (Ubah berkas jadi Base64 String)
          const base64Data = await convertFileToBase64(selectedUploadFile);
          
          const newPhoto = {
            id: `mock-${Date.now()}`,
            title,
            category,
            description,
            image_url: base64Data, // dataURI base64 langsung dirender browser lokal
            file_path: `simulasi-path-${Date.now()}-${selectedUploadFile.name}`,
            created_at: new Date().toISOString()
          };
          
          // Baca, modifikasi, dan simpan kembali ke local storage
          const localPhotos = JSON.parse(localStorage.getItem('aesthetic_frame_photos') || '[]');
          localPhotos.unshift(newPhoto);
          localStorage.setItem('aesthetic_frame_photos', JSON.stringify(localPhotos));
          
          showToast("Karya foto disimpan berhasil (Sesi Simulasi Lokal)!", "success");
        }
        
        // Reset berkas form input & preview
        uploadForm.reset();
        clearFilePreview();
        
        // Refresh & Navigasi kembali ke List Kelola Foto
        await initDashboard();
        const navPhotos = document.getElementById('nav-photos');
        if (navPhotos) navPhotos.click();
        
      } catch (err) {
        console.error("Kesalahan upload:", err);
        showToast(err.message || "Gagal mengupload foto. Silakan coba kembali.", "error");
      } finally {
        showSpinner(false);
      }
    });
  }

  // 5. UPDATE SUBMIT DETAIL FOTO (MODAL FORM)
  const editForm = document.getElementById('edit-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('edit-photo-id').value;
      const title = document.getElementById('edit-title').value;
      const category = document.getElementById('edit-category').value;
      const description = document.getElementById('edit-description').value;
      
      showSpinner(true);
      closeEditModal();
      
      try {
        if (isConfigured && supabaseClient) {
          const { error } = await supabaseClient
            .from('photos')
            .update({ title, category, description })
            .eq('id', id);
            
          if (error) throw error;
          showToast("Metadata foto berhasil diperbarui di database!", "success");
        } else {
          // Update Simulasi Lokal
          const localPhotos = JSON.parse(localStorage.getItem('aesthetic_frame_photos') || '[]');
          const updatedPhotos = localPhotos.map(photo => {
            if (photo.id === id) {
              return { ...photo, title, category, description };
            }
            return photo;
          });
          localStorage.setItem('aesthetic_frame_photos', JSON.stringify(updatedPhotos));
          showToast("Metadata foto diperbarui (Simulasi Lokal)!", "success");
        }
        
        // Muat ulang daftar dashboard
        await initDashboard();
        
      } catch (err) {
        console.error("Gagal melakukan update metadata:", err);
        showToast(err.message || "Gagal memperbarui metadata foto.", "error");
      } finally {
        showSpinner(false);
      }
    });
  }

  // Tombol batal modal edit
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const btnCloseModal = document.getElementById('btn-close-modal');
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeEditModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeEditModal);
}

// Konfigurasi Input File, Drag, & Drop Gambar
function setupUploadDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('photo-image-input');
  const btnBrowse = document.getElementById('btn-browse-file');
  const btnClearPreview = document.getElementById('btn-clear-preview');
  
  if (!dropZone || !fileInput) return;
  
  // Trigger pemilihan input file lewat tombol manual
  if (btnBrowse) {
    btnBrowse.addEventListener('click', () => {
      fileInput.click();
    });
  }
  
  // File hand-off saat dipilih manual
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
      handleSelectedFile(fileInput.files[0]);
    }
  });

  // Event dragover dnd
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    
    if (e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  // Tombol silang reset berkas upload
  if (btnClearPreview) {
    btnClearPreview.addEventListener('click', clearFilePreview);
  }
}

// Memproses Berkas Mentah Gambar yang Masuk
function handleSelectedFile(file) {
  // Validasi format file
  if (!file.type.startsWith('image/')) {
    showToast("Format file tidak didukung! Pastikan berkas berupa gambar.", "error");
    return;
  }
  
  // Simpan ref berkas ke state global
  selectedUploadFile = file;
  
  // Render Pratinjau (Preview) Gambar
  const reader = new FileReader();
  reader.onload = (e) => {
    const previewImg = document.getElementById('image-upload-preview');
    const previewContainer = document.getElementById('image-upload-preview-container');
    const dropZone = document.getElementById('drop-zone');
    
    if (previewImg && previewContainer) {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'block';
      if (dropZone) dropZone.style.display = 'none'; // Sembunyikan panel dnd sementara
    }
  };
  reader.readAsDataURL(file);
}

// Menghapus Pratinjau Gambar & Mereset Pilihan Berkas
function clearFilePreview() {
  selectedUploadFile = null;
  
  const fileInput = document.getElementById('photo-image-input');
  const previewImg = document.getElementById('image-upload-preview');
  const previewContainer = document.getElementById('image-upload-preview-container');
  const dropZone = document.getElementById('drop-zone');
  
  if (fileInput) fileInput.value = '';
  if (previewImg) previewImg.src = '';
  if (previewContainer) previewContainer.style.display = 'none';
  if (dropZone) dropZone.style.display = 'flex'; // Kembalikan dropzone
}

// Membuka Modal Pengeditan dan Memuat Data Terpilih
function openEditModal(photoId) {
  const targetPhoto = currentPhotos.find(p => p.id === photoId);
  if (!targetPhoto) return;
  
  document.getElementById('edit-photo-id').value = targetPhoto.id;
  document.getElementById('edit-title').value = targetPhoto.title;
  document.getElementById('edit-category').value = targetPhoto.category || '';
  document.getElementById('edit-description').value = targetPhoto.description || '';
  
  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Menutup Popup Frame Modal Edit
function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Handler Aksi PENGHAPUSAN Foto
async function handleDeletePhoto(photoId) {
  const targetPhoto = currentPhotos.find(p => p.id === photoId);
  if (!targetPhoto) return;
  
  const verified = confirm(`Apakah Anda yakin ingin menghapus karya foto "${targetPhoto.title}" dari galeri? Tindakan ini tidak dapat dibatalkan.`);
  if (!verified) return;
  
  showSpinner(true);
  
  try {
    if (isConfigured && supabaseClient) {
      // 1. Hapus entri meta di Database photos
      const { error: dbError } = await supabaseClient
        .from('photos')
        .delete()
        .eq('id', photoId);
        
      if (dbError) throw dbError;
      
      // 2. Hapus fail fisik di bucket Supabase Storage
      if (targetPhoto.file_path) {
        const { error: storageError } = await supabaseClient.storage
          .from('gallery-images')
          .remove([targetPhoto.file_path]);
          
        if (storageError) {
          // Cetak error saja, jangan blokir proses karena entri db sudah terhapus
          console.error("Peringatan, kegagalan menghapus berkas penyimpanan fisik:", storageError);
        }
      }
      
      showToast("Karya foto berhasil dihapus permanen!", "success");
    } else {
      // Mode Simulasi Hapus Lokal
      const localPhotos = JSON.parse(localStorage.getItem('aesthetic_frame_photos') || '[]');
      const filteredPhotos = localPhotos.filter(p => p.id !== photoId);
      localStorage.setItem('aesthetic_frame_photos', JSON.stringify(filteredPhotos));
      showToast("Foto terhapus (Simulasi Lokal)!", "success");
    }
    
    // Sinkronkan ulang data dashboard terkini
    await initDashboard();
    
  } catch (err) {
    console.error("Kegagalan proses penghapusan:", err);
    showToast(err.message || "Gagal menghapus foto dari sistem.", "error");
    showSpinner(false);
  }
}

// Fungsi Bantu: Mengubah Berkas Fisik Ke Format Base64 String
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
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

