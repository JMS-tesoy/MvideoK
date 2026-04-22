/* ============================================================================
   VIDEOKE PLAYER - CORE APPLICATION LOGIC
   Lightweight, zero dependencies, LocalStorage + IndexedDB ready
   ========================================================================== */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const APP_STATE = {
  currentMode: 'videoke',
  currentFolder: 'C:',
  currentTrack: null,
  isPlaying: false,
  isShuffling: false,
  repeatMode: 0, // 0: off, 1: all, 2: one
  volume: 80,
  queue: [],
  mediaLibrary: [],
  recentTrackIds: [],
  searchTerm: '',
  sortBy: 'name',
};

// Sample media library (will be replaced with actual file scanning)
const SAMPLE_MEDIA = [
  {
    id: '1',
    name: 'Dahil Sa Iyo',
    type: 'videoke',
    artist: 'OPM Artist',
    duration: 260,
    folder: 'C:',
    icon: '🎤',
  },
  {
    id: '2',
    name: 'Magandang Gabi',
    type: 'movie',
    artist: 'Film Studio',
    duration: 5400,
    folder: 'C:',
    icon: '🎬',
  },
  {
    id: '3',
    name: 'House Music Mix',
    type: 'dj',
    artist: 'DJ Producer',
    duration: 480,
    folder: 'C:',
    icon: '🎧',
  },
  {
    id: '4',
    name: 'Ngiti Mo',
    type: 'videoke',
    artist: 'OPM Artist',
    duration: 260,
    folder: 'C:',
    icon: '🎤',
  },
  {
    id: '5',
    name: 'Summer Vibes',
    type: 'dj',
    artist: 'Music Producer',
    duration: 300,
    folder: 'C:',
    icon: '🎧',
  },
];

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const DOM = {
  // Header
  modeBtns: document.querySelectorAll('.mode-btn'),
  
  // Sidebar
  folderItems: document.querySelectorAll('.folder-item'),
  searchInput: document.getElementById('search-input'),
  
  // Browser
  mediaGrid: document.getElementById('media-grid'),
  emptyState: document.getElementById('empty-state'),
  loadingState: document.getElementById('loading-state'),
  currentFolderEl: document.getElementById('current-folder'),
  fileCountEl: document.getElementById('file-count'),
  sortSelect: document.getElementById('sort-select'),
  refreshBtn: document.getElementById('refresh-btn'),
  
  // Player
  npTitle: document.getElementById('np-title'),
  npMeta: document.getElementById('np-meta'),
  npThumbnail: document.getElementById('np-thumbnail'),
  playBtn: document.getElementById('play-btn'),
  playIcon: document.getElementById('play-icon'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  shuffleBtn: document.getElementById('shuffle-btn'),
  repeatBtn: document.getElementById('repeat-btn'),
  favBtn: document.getElementById('fav-btn'),
  
  // Progress
  progressSlider: document.getElementById('progress-slider'),
  progressFill: document.getElementById('progress-fill'),
  timeCurrent: document.getElementById('time-current'),
  timeTotal: document.getElementById('time-total'),
  
  // Volume
  volumeSlider: document.getElementById('volume-slider'),
  volumeBtn: document.getElementById('volume-btn'),
  
  // Queue
  queueBtn: document.getElementById('queue-btn'),
  queuePanel: document.getElementById('queue-panel'),
  queueList: document.getElementById('queue-list'),
  queueClose: document.getElementById('queue-close'),
  
  // Modals
  settingsBtn: document.getElementById('settings-btn'),
  infoBtn: document.getElementById('info-btn'),
  settingsModal: document.getElementById('settings-modal'),
  modalOverlay: document.getElementById('modal-overlay'),
  darkModeToggle: document.getElementById('dark-mode-toggle'),
  
  // Stats
  totalSongs: document.getElementById('total-songs'),
  totalVideos: document.getElementById('total-videos'),
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎵 Videoke Player initialized');
  
  // Initialize media library
  APP_STATE.mediaLibrary = [...SAMPLE_MEDIA];
  
  // Bind event listeners
  bindEventListeners();
  
  // Load settings from localStorage
  loadSettings();
  
  // Render initial state
  updateStats();
  renderMediaGrid(filterMedia(APP_STATE.mediaLibrary));
  updatePlayerInfo();
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function bindEventListeners() {
  // Mode selection
  DOM.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });
  
  // Folder selection
  DOM.folderItems.forEach(btn => {
    btn.addEventListener('click', () => selectFolder(btn));
  });
  
  // Search
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', (e) => {
      APP_STATE.searchTerm = e.target.value.toLowerCase();
      renderMediaGrid(filterMedia(APP_STATE.mediaLibrary));
    });
  }
  
  // Sort
  if (DOM.sortSelect) {
    DOM.sortSelect.addEventListener('change', (e) => {
      APP_STATE.sortBy = e.target.value;
      renderMediaGrid(filterMedia(APP_STATE.mediaLibrary));
    });
  }
  
  // Player controls
  DOM.playBtn?.addEventListener('click', togglePlay);
  DOM.prevBtn?.addEventListener('click', previousTrack);
  DOM.nextBtn?.addEventListener('click', nextTrack);
  DOM.shuffleBtn?.addEventListener('click', toggleShuffle);
  DOM.repeatBtn?.addEventListener('click', toggleRepeat);
  DOM.favBtn?.addEventListener('click', toggleFavorite);
  
  // Progress
  DOM.progressSlider?.addEventListener('input', seekTrack);
  
  // Volume
  DOM.volumeSlider?.addEventListener('input', changeVolume);
  
  // Queue
  DOM.queueBtn?.addEventListener('click', toggleQueue);
  DOM.queueClose?.addEventListener('click', toggleQueue);
  DOM.modalOverlay?.addEventListener('click', closeAllModals);
  
  // Settings
  DOM.settingsBtn?.addEventListener('click', () => openModal('settings-modal'));
  DOM.darkModeToggle?.addEventListener('change', toggleDarkMode);
  DOM.infoBtn?.addEventListener('click', () => openModal('settings-modal'));
  DOM.refreshBtn?.addEventListener('click', refreshLibraryView);
}

// ============================================================================
// MODE SWITCHING
// ============================================================================

function switchMode(mode) {
  APP_STATE.currentMode = mode;
  
  // Update button states
  DOM.modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  // Filter media by mode
  const filtered = filterMedia(APP_STATE.mediaLibrary);
  renderMediaGrid(filtered);
  
  console.log(`📺 Switched to ${mode} mode`);
}

// ============================================================================
// FOLDER SELECTION
// ============================================================================

function selectFolder(btn) {
  // Update button states
  DOM.folderItems.forEach(item => {
    item.classList.remove('active');
  });
  btn.classList.add('active');
  
  // Update current folder
  APP_STATE.currentFolder = btn.dataset.folder;
  const folderName = btn.querySelector('.folder-name')?.textContent || btn.textContent.trim();
  DOM.currentFolderEl.textContent = folderName;
  
  // Show loading state
  showLoadingState();
  
  // Simulate folder scan (in real app, this calls Tauri backend)
  setTimeout(() => {
    const filtered = filterMedia(APP_STATE.mediaLibrary);
    renderMediaGrid(filtered);
    hideLoadingState();
    console.log(`📁 Browsing: ${APP_STATE.currentFolder}`);
  }, 800);
}

// ============================================================================
// MEDIA FILTERING & SORTING
// ============================================================================

function filterMedia(library) {
  let filtered = library.filter(item => {
    // Filter by mode (if not viewing all)
    if (APP_STATE.currentMode !== 'all') {
      if (item.type !== APP_STATE.currentMode) return false;
    }
    
    // Filter by folder / quick-access virtual folders
    if (APP_STATE.currentFolder === 'favorites') {
      if (!item.isFavorite) return false;
    } else if (APP_STATE.currentFolder === 'recents') {
      if (!APP_STATE.recentTrackIds.includes(item.id)) return false;
    } else if (APP_STATE.currentFolder === 'playlists') {
      return false;
    } else if (item.folder !== APP_STATE.currentFolder) {
      return false;
    }
    
    // Filter by search term
    if (APP_STATE.searchTerm) {
      const searchMatch = 
        item.name.toLowerCase().includes(APP_STATE.searchTerm) ||
        (item.artist && item.artist.toLowerCase().includes(APP_STATE.searchTerm));
      if (!searchMatch) return false;
    }
    
    return true;
  });
  
  // Sort
  filtered.sort((a, b) => {
    switch (APP_STATE.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'artist':
        return (a.artist || '').localeCompare(b.artist || '');
      case 'duration':
        return a.duration - b.duration;
      case 'date':
        return (b.dateAdded || 0) - (a.dateAdded || 0);
      default:
        return 0;
    }
  });
  
  return filtered;
}

function refreshLibraryView() {
  showLoadingState();
  setTimeout(() => {
    renderMediaGrid(filterMedia(APP_STATE.mediaLibrary));
    hideLoadingState();
  }, 300);
}

// ============================================================================
// RENDERING
// ============================================================================

function renderMediaGrid(media) {
  const grid = DOM.mediaGrid;
  
  if (!media || media.length === 0) {
    grid.style.display = 'none';
    DOM.emptyState.style.display = 'flex';
    DOM.fileCountEl.textContent = '(0 files)';
    return;
  }
  
  grid.style.display = 'grid';
  DOM.emptyState.style.display = 'none';
  DOM.fileCountEl.textContent = `(${media.length} files)`;
  
  grid.innerHTML = media.map(item => `
    <div class="media-item ${APP_STATE.currentTrack?.id === item.id ? 'playing' : ''}" 
         data-id="${item.id}"
         onclick="playMedia('${item.id}')">
      <div class="media-icon">${item.icon}</div>
      <div class="media-name">${escapeHtml(item.name)}</div>
      <div class="media-duration">${formatTime(item.duration)}</div>
    </div>
  `).join('');
}

function updatePlayerInfo() {
  if (APP_STATE.currentTrack) {
    DOM.npTitle.textContent = APP_STATE.currentTrack.name;
    DOM.npMeta.innerHTML = `
      <span class="np-artist">${APP_STATE.currentTrack.artist || 'Unknown Artist'}</span>
      <span class="np-duration">${formatTime(APP_STATE.currentTrack.duration)}</span>
    `;
    DOM.npThumbnail.textContent = APP_STATE.currentTrack.icon;
  } else {
    DOM.npTitle.textContent = 'No track playing';
    DOM.npMeta.innerHTML = '<span class="np-artist">Select a file to play</span>';
    DOM.npThumbnail.textContent = '🎵';
  }
}

// ============================================================================
// PLAYBACK CONTROL
// ============================================================================

function playMedia(id) {
  const track = APP_STATE.mediaLibrary.find(m => m.id === id);
  if (!track) return;
  
  APP_STATE.currentTrack = track;
  APP_STATE.isPlaying = true;
  APP_STATE.recentTrackIds = [id, ...APP_STATE.recentTrackIds.filter(trackId => trackId !== id)].slice(0, 50);
  
  updatePlayerInfo();
  renderMediaGrid(filterMedia(APP_STATE.mediaLibrary));
  updatePlayButton();
  
  console.log(`▶️  Playing: ${track.name}`);
}

function togglePlay() {
  if (!APP_STATE.currentTrack) {
    // If nothing selected, play first media
    const media = filterMedia(APP_STATE.mediaLibrary);
    if (media.length > 0) {
      playMedia(media[0].id);
    }
    return;
  }
  
  APP_STATE.isPlaying = !APP_STATE.isPlaying;
  updatePlayButton();
}

function updatePlayButton() {
  if (DOM.playIcon) {
    DOM.playIcon.textContent = APP_STATE.isPlaying ? '⏸' : '▶';
  }
}

function previousTrack() {
  if (!APP_STATE.currentTrack) return;
  
  const filtered = filterMedia(APP_STATE.mediaLibrary);
  const currentIndex = filtered.findIndex(m => m.id === APP_STATE.currentTrack.id);
  
  if (currentIndex <= 0) return;
  
  playMedia(filtered[currentIndex - 1].id);
}

function nextTrack() {
  if (!APP_STATE.currentTrack) return;
  
  const filtered = filterMedia(APP_STATE.mediaLibrary);
  const currentIndex = filtered.findIndex(m => m.id === APP_STATE.currentTrack.id);
  
  if (currentIndex >= filtered.length - 1) {
    // Last track, loop back to first if repeat is on
    if (APP_STATE.repeatMode > 0) {
      playMedia(filtered[0].id);
    }
    return;
  }
  
  playMedia(filtered[currentIndex + 1].id);
}

function toggleShuffle() {
  APP_STATE.isShuffling = !APP_STATE.isShuffling;
  DOM.shuffleBtn?.classList.toggle('active', APP_STATE.isShuffling);
  console.log(`🔀 Shuffle: ${APP_STATE.isShuffling ? 'ON' : 'OFF'}`);
}

function toggleRepeat() {
  APP_STATE.repeatMode = (APP_STATE.repeatMode + 1) % 3;
  
  const repeatStates = ['🔁 Off', '🔁 All', '🔁 One'];
  if (DOM.repeatBtn) {
    DOM.repeatBtn.title = repeatStates[APP_STATE.repeatMode];
    DOM.repeatBtn.classList.toggle('active', APP_STATE.repeatMode > 0);
  }
  
  console.log(`🔁 Repeat: ${repeatStates[APP_STATE.repeatMode]}`);
}

function toggleFavorite() {
  if (!APP_STATE.currentTrack) return;
  
  APP_STATE.currentTrack.isFavorite = !APP_STATE.currentTrack.isFavorite;
  if (DOM.favBtn) {
    DOM.favBtn.classList.toggle('active', APP_STATE.currentTrack.isFavorite);
    DOM.favBtn.innerHTML = `<span>${APP_STATE.currentTrack.isFavorite ? '★' : '☆'}</span>`;
  }
  renderMediaGrid(filterMedia(APP_STATE.mediaLibrary));
  
  console.log(`💛 Added to favorites: ${APP_STATE.currentTrack.name}`);
}

// ============================================================================
// PROGRESS & VOLUME
// ============================================================================

function seekTrack(e) {
  const progress = e.target.value;
  if (DOM.progressFill) DOM.progressFill.style.width = progress + '%';
  if (DOM.timeCurrent) DOM.timeCurrent.textContent = formatTime((progress / 100) * APP_STATE.currentTrack?.duration || 0);
}

function changeVolume(e) {
  APP_STATE.volume = Number(e.target.value);
  DOM.volumeBtn?.classList.toggle('active', APP_STATE.volume > 0);
}

// ============================================================================
// QUEUE
// ============================================================================

function toggleQueue() {
  if (!DOM.queuePanel) return;
  DOM.queuePanel.classList.toggle('open');
  updateQueue();
}

function updateQueue() {
  const filtered = filterMedia(APP_STATE.mediaLibrary);
  if (!DOM.queueList) return;

  if (filtered.length === 0) {
    DOM.queueList.innerHTML = '<div class="queue-item">Queue is empty</div>';
    return;
  }

  DOM.queueList.innerHTML = filtered.slice(0, 20).map((item, idx) => `
    <div class="queue-item ${APP_STATE.currentTrack?.id === item.id ? 'playing' : ''}"
         onclick="playMedia('${item.id}')">
      <span>${idx + 1}. ${escapeHtml(item.name)}</span>
      <span>${formatTime(item.duration)}</span>
    </div>
  `).join('');
}

// ============================================================================
// MODALS
// ============================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.add('open');
  DOM.modalOverlay.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('open');
  DOM.modalOverlay.classList.remove('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('open');
  });
  DOM.modalOverlay.classList.remove('open');
}

// ============================================================================
// SETTINGS
// ============================================================================

function toggleDarkMode(e) {
  const isDark = e.target.checked;
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  localStorage.setItem('darkMode', isDark);
}

function loadSettings() {
  try {
    const storedState = localStorage.getItem('appState');
    if (storedState) {
      const parsed = JSON.parse(storedState);
      Object.assign(APP_STATE, {
        isShuffling: !!parsed.isShuffling,
        repeatMode: Number(parsed.repeatMode) || 0,
        volume: Number(parsed.volume) || APP_STATE.volume,
        currentMode: parsed.currentMode || APP_STATE.currentMode,
        currentFolder: parsed.currentFolder || APP_STATE.currentFolder,
        recentTrackIds: Array.isArray(parsed.recentTrackIds) ? parsed.recentTrackIds : [],
      });
    }
  } catch (error) {
    console.warn('Could not restore saved state:', error);
  }

  const darkMode = localStorage.getItem('darkMode') !== 'false';
  if (DOM.darkModeToggle) DOM.darkModeToggle.checked = darkMode;
  document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';

  if (DOM.volumeSlider) DOM.volumeSlider.value = APP_STATE.volume;
  if (DOM.modeBtns) {
    DOM.modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === APP_STATE.currentMode);
    });
  }
  if (DOM.folderItems) {
    DOM.folderItems.forEach(item => {
      item.classList.toggle('active', item.dataset.folder === APP_STATE.currentFolder);
    });
  }
}

function saveSettings() {
  localStorage.setItem('appState', JSON.stringify(APP_STATE));
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoadingState() {
  DOM.mediaGrid.style.display = 'none';
  DOM.emptyState.style.display = 'none';
  DOM.loadingState.style.display = 'flex';
}

function hideLoadingState() {
  DOM.loadingState.style.display = 'none';
}

function updateStats() {
  const songs = APP_STATE.mediaLibrary.filter(m => m.type === 'videoke' || m.type === 'dj').length;
  const videos = APP_STATE.mediaLibrary.filter(m => m.type === 'movie').length;
  
  DOM.totalSongs.textContent = songs;
  DOM.totalVideos.textContent = videos;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

document.addEventListener('keydown', (e) => {
  if (e.target === DOM.searchInput) return;
  
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      nextTrack();
      break;
    case 'ArrowLeft':
      previousTrack();
      break;
  }
});

// ============================================================================
// AUTO-SAVE STATE
// ============================================================================

window.addEventListener('beforeunload', () => {
  saveSettings();
});

setInterval(() => {
  saveSettings();
}, 10000); // Auto-save every 10 seconds
