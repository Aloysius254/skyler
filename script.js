let musicPlaying = false;
let autoplayDone = false;
const music = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

// Set low background volume
music.volume = 0.3;

// Check if music was playing on previous page
const wasMusicPlaying = sessionStorage.getItem('musicPlaying') === 'true';
if (wasMusicPlaying) {
    music.play().then(() => {
        musicPlaying = true;
        musicToggle.classList.add('playing');
    }).catch(() => {
        // Autoplay blocked
    });
}

// Autoplay on first user interaction (click, touch, or keydown)
// Browsers require a user gesture before audio can play
function tryAutoplay() {
    if (autoplayDone) return;
    autoplayDone = true;

    // Only autoplay if music wasn't already started from session storage
    if (!musicPlaying) {
        music.play()
            .then(() => {
                musicPlaying = true;
                musicToggle.classList.add('playing');
                sessionStorage.setItem('musicPlaying', 'true');
            })
            .catch(() => {
                // Autoplay was blocked — user can still click the 🎵 button manually
            });
    }

    // Remove all three listeners once fired
    document.removeEventListener('click',      tryAutoplay);
    document.removeEventListener('touchstart', tryAutoplay);
    document.removeEventListener('keydown',    tryAutoplay);
}

document.addEventListener('click',      tryAutoplay);
document.addEventListener('touchstart', tryAutoplay);
document.addEventListener('keydown',    tryAutoplay);

// Manual toggle — play/pause
function toggleMusic() {
    if (musicPlaying) {
        music.pause();
        musicToggle.classList.remove('playing');
        sessionStorage.setItem('musicPlaying', 'false');
    } else {
        music.play();
        musicToggle.classList.add('playing');
        sessionStorage.setItem('musicPlaying', 'true');
    }
    musicPlaying = !musicPlaying;
}

// Scroll Animation for Notice Cards
function handleScrollAnimation() {
    const cards = document.querySelectorAll('.notice-card');
    
    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (cardTop < windowHeight * 0.8) {
            card.classList.add('visible');
        }
    });
}

window.addEventListener('scroll', handleScrollAnimation);
window.addEventListener('load', handleScrollAnimation);

// Gallery Functions - Shared gallery visible to everyone via Firebase
let uploadedPhotos = [];
let database;

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB_fs3xeqg5LFrg-Sg55MCqmliSbiP2iZE",
    authDomain: "skyler-9b18a.firebaseapp.com",
    databaseURL: "https://skyler-9b18a-default-rtdb.firebaseio.com",
    projectId: "skyler-9b18a",
    storageBucket: "skyler-9b18a.firebasestorage.app",
    messagingSenderId: "481365693064",
    appId: "1:481365693064:web:e447271eb73b58f1a4853d",
    measurementId: "G-4PXQYS50E7"
};

// Check if Firebase is available and initialize
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        console.log('✅ Firebase connected - gallery is now shared!');
    } catch (error) {
        console.log('Firebase not available, using localStorage');
    }
}

// Load photos from Firebase (shared) or localStorage (fallback)
function loadGallery() {
    if (database) {
        // Load from Firebase - visible to everyone
        database.ref('photos').on('value', (snapshot) => {
            const data = snapshot.val();
            uploadedPhotos = data ? Object.values(data) : [];
            renderGallery();
        });
    } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('skylerSharedGallery');
        uploadedPhotos = stored ? JSON.parse(stored) : [];
        renderGallery();
    }
}

function openUpload() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUpload() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('previewContainer').classList.remove('active');
    document.getElementById('photoInput').value = '';
    document.getElementById('captionInput').value = '';
}

function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        // Compress image before preview
        compressImage(file, (compressedDataUrl) => {
            const previewContainer = document.getElementById('previewContainer');
            const previewImage = document.getElementById('previewImage');
            previewImage.src = compressedDataUrl;
            previewContainer.classList.add('active');
        });
    }
}

function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Max dimensions for compressed image
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with 0.7 quality (70% - good balance between quality and size)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedDataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function savePhoto() {
    const previewImage = document.getElementById('previewImage');
    const caption = document.getElementById('captionInput').value || 'a beautiful memory';
    
    if (previewImage.src && previewImage.src.startsWith('data:image')) {
        const photo = {
            id: Date.now(),
            src: previewImage.src,
            caption: caption,
            date: new Date().toISOString()
        };
        
        if (database) {
            // Save to Firebase - visible to everyone
            database.ref('photos/' + photo.id).set(photo)
                .then(() => {
                    closeUpload();
                })
                .catch((error) => {
                    console.error('Firebase save error:', error);
                    alert('Could not save to cloud. Saving locally.');
                    saveToLocalStorage(photo);
                });
        } else {
            // Fallback to localStorage
            saveToLocalStorage(photo);
        }
    } else {
        alert('Please select an image first! 📷');
    }
}

function saveToLocalStorage(photo) {
    uploadedPhotos.push(photo);
    localStorage.setItem('skylerSharedGallery', JSON.stringify(uploadedPhotos));
    renderGallery();
    closeUpload();
}

function renderGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    // Keep the add photo card
    const addCard = galleryGrid.querySelector('.add-photo-card');
    galleryGrid.innerHTML = '';
    
    uploadedPhotos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${photo.src}" alt="${photo.caption}">
            <div class="caption">${photo.caption}</div>
            <button class="delete-btn" onclick="deletePhoto(${photo.id})" title="Delete photo">
                <span>🗑️</span>
            </button>
        `;
        galleryGrid.appendChild(item);
    });
    
    galleryGrid.appendChild(addCard);
}

function deletePhoto(photoId) {
    if (confirm('Delete this photo? 🥺')) {
        if (database) {
            // Delete from Firebase
            database.ref('photos/' + photoId).remove()
                .catch((error) => {
                    console.error('Firebase delete error:', error);
                    alert('Could not delete from cloud.');
                });
        } else {
            // Delete from localStorage
            uploadedPhotos = uploadedPhotos.filter(photo => photo.id !== photoId);
            localStorage.setItem('skylerSharedGallery', JSON.stringify(uploadedPhotos));
            renderGallery();
        }
    }
}

// Initialize gallery if on gallery page
if (document.getElementById('galleryGrid')) {
    loadGallery();
}

// Initialize snaps page if on snaps page
if (document.getElementById('snapsContainer')) {
    loadSnaps();
}

// Load Snaps from Firebase
function loadSnaps() {
    const container = document.getElementById('snapsContainer');
    container.innerHTML = '<div class="loading">Loading snaps... ✨</div>';
    
    if (database) {
        database.ref('photos').on('value', (snapshot) => {
            const data = snapshot.val();
            const photos = data ? Object.values(data) : [];
            renderSnaps(photos);
        });
    } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('skylerSharedGallery');
        const photos = stored ? JSON.parse(stored) : [];
        renderSnaps(photos);
    }
}

function renderSnaps(photos) {
    const container = document.getElementById('snapsContainer');
    
    if (photos.length === 0) {
        container.innerHTML = `
            <div class="no-snaps">
                <p>No snaps yet... 📸</p>
                <p style="font-size: 0.9rem;">Upload photos in the <a href="gallery.html" style="color: var(--accent-light);">gallery</a> to see them here!</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    photos.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    container.innerHTML = '';
    
    photos.forEach((photo, index) => {
        const snap = document.createElement('div');
        snap.className = 'snap-card';
        snap.style.animationDelay = `${index * 0.1}s`;
        
        const date = photo.date ? new Date(photo.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }) : 'Recently';
        
        snap.innerHTML = `
            <img src="${photo.src}" alt="${photo.caption}" class="snap-image" loading="lazy">
            <div class="snap-content">
                <p class="snap-caption">${photo.caption}</p>
                <p class="snap-date">${date}</p>
            </div>
            <div class="snap-actions">
                <button class="snap-action-btn" onclick="toggleLike(this)">💜</button>
                <button class="snap-action-btn">💬</button>
                <button class="snap-action-btn">📤</button>
            </div>
        `;
        
        container.appendChild(snap);
    });
}

function toggleLike(btn) {
    btn.classList.toggle('liked');
    if (btn.classList.contains('liked')) {
        btn.textContent = '❤️';
    } else {
        btn.textContent = '💜';
    }
}

// ========================================
// ROMANTIC INTERACTIONS & ANIMATIONS
// ========================================

const heroTagline = document.getElementById('heroTagline');
const taglineMessages = [
    "Not just a website.",
    "Not just words.",
    "Just something from the heart.",
    "For you. 💜"
];
let taglineIndex = 0;
let taglineCharIndex = 0;
let isTaglineDeleting = false;

function typeTagline() {
    if (!heroTagline) return;
    const currentText = taglineMessages[taglineIndex];
    
    if (isTaglineDeleting) {
        heroTagline.textContent = currentText.substring(0, taglineCharIndex - 1);
        taglineCharIndex--;
        
        if (taglineCharIndex === 0) {
            isTaglineDeleting = false;
            taglineIndex = (taglineIndex + 1) % taglineMessages.length;
            setTimeout(typeTagline, 500);
        } else {
            setTimeout(typeTagline, 50);
        }
    } else {
        heroTagline.textContent = currentText.substring(0, taglineCharIndex + 1);
        taglineCharIndex++;
        
        if (taglineCharIndex === currentText.length) {
            heroTagline.classList.add('typing-complete');
            setTimeout(() => {
                heroTagline.classList.remove('typing-complete');
                isTaglineDeleting = true;
                setTimeout(typeTagline, 2000);
            }, 2500);
        } else {
            setTimeout(typeTagline, 100);
        }
    }
}

// Start tagline typing after page load
if (heroTagline) setTimeout(typeTagline, 1200);

// Cursor Glow Effect
const cursorGlow = document.querySelector('.cursor-glow');
if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });
}

// Starry Background Canvas
const canvas = document.getElementById('starsCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Regenerate stars on resize
        stars = [];
        for (let i = 0; i < 150; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                opacity: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.005
            });
        }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function drawStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.opacity += star.twinkleSpeed;
            if (star.opacity > 1 || star.opacity < 0) {
                star.twinkleSpeed = -star.twinkleSpeed;
            }
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
        });
        requestAnimationFrame(drawStars);
    }
    drawStars();
}

// Floating Particles (hearts, sparkles, stars)
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
    const particleIcons = ['✨', '💜', '🌙', '💫', '✦'];

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = particleIcons[Math.floor(Math.random() * particleIcons.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 5 + 6) + 's';
        particle.style.fontSize = (Math.random() * 10 + 15) + 'px';
        particlesContainer.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 8000);
    }

    setInterval(createParticle, 800);
}

// IntersectionObserver for Scroll Animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all animatable elements
document.querySelectorAll('.notice-card, .vibe-item, .open-when-card').forEach(el => {
    observer.observe(el);
});

// "You Are..." Sequential Animation
const youAreWords = document.querySelectorAll('.you-are-word');
const youAreObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            youAreWords.forEach((word, index) => {
                setTimeout(() => {
                    word.classList.add('visible');
                }, index * 400);
            });
            youAreObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

if (document.querySelector('.you-are-section')) {
    youAreObserver.observe(document.querySelector('.you-are-section'));
}

// Cinematic Section Sequential Animation
const cinematicLines = document.querySelectorAll('.cinematic-line');
const cinematicObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            cinematicLines.forEach((line, index) => {
                setTimeout(() => {
                    line.classList.add('visible');
                }, index * 800);
            });
            cinematicObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

if (document.querySelector('.cinematic-section')) {
    cinematicObserver.observe(document.querySelector('.cinematic-section'));
}

// Open When Cards - Messages for modal
const openWhenMessages = {
    sad: {
        icon: '💌',
        title: 'When you\'re sad',
        message: 'Hey, I know things feel heavy right now. But you\'ve gotten through 100% of your bad days so far. You\'re stronger than you think, and you\'re never alone. I\'m here, always. 💜'
    },
    sleep: {
        icon: '🌙',
        title: 'When you can\'t sleep',
        message: 'It\'s one of those nights, huh? Your mind won\'t stop racing. But tomorrow is a new day, and everything will look different in the morning. Close your eyes, take a deep breath, and know that I\'m thinking of you. Sweet dreams, bestie. 🌙'
    },
    laugh: {
        icon: '😂',
        title: 'When you need to laugh',
        message: 'Remember that time we couldn\'t stop laughing over the dumbest thing? 😂 Life is too short to take everything seriously. Go watch something funny, text me a stupid meme, or just smile for no reason. You deserve to feel light. ✨'
    },
    reminder: {
        icon: '🥹',
        title: 'When you need a reminder',
        message: 'You are enough. Exactly as you are. You don\'t need to be perfect, or have it all together, or prove anything to anyone. You\'re doing your best, and that\'s more than enough. I see you, and I\'m so proud of you. 💜'
    },
    amazing: {
        icon: '✨',
        title: 'When you forget how amazing you are',
        message: 'Sometimes you forget, so let me remind you: You are kind. You are funny. You are beautiful inside and out. You light up every room you walk into. The world is better because you\'re in it. Don\'t ever forget that. ✨'
    }
};

function openMessage(type) {
    const modal = document.getElementById('openWhenModal');
    const msg = openWhenMessages[type];
    
    document.getElementById('modalIcon').textContent = msg.icon;
    document.getElementById('modalTitle').textContent = msg.title;
    document.getElementById('modalMessage').textContent = msg.message;
    
    modal.classList.add('active');
}

function closeMessage() {
    document.getElementById('openWhenModal').classList.remove('active');
}

// Close modal when clicking outside
document.getElementById('openWhenModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'openWhenModal') {
        closeMessage();
    }
});

// Load Snaps from JSON
async function loadSnaps() {
    const grid = document.getElementById('snapsGrid');
    if (!grid) return;

    try {
        const response = await fetch('snaps.json');
        const snaps = await response.json();

        grid.innerHTML = '';

        snaps.forEach((snap, index) => {
            const rotation = (Math.random() - 0.5) * 6; // -3 to 3 degrees
            const card = document.createElement('div');
            card.className = 'snap-card';
            card.style.setProperty('--rotation', `${rotation}deg`);
            card.innerHTML = `
                <div class="snap-inner">
                    <img class="snap-image" src="${snap.src}" alt="${snap.caption}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="snap-placeholder" style="display:none; width:100%; aspect-ratio:4/5; background:var(--card-bg); border-radius:8px 8px 0 0; align-items:center; justify-content:center; color:var(--text-secondary); font-size:3rem;">📷</div>
                    <div class="snap-caption-area">
                        <div class="snap-tape"></div>
                        <p class="snap-caption">${snap.caption}</p>
                        <p class="snap-date">${snap.date}</p>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load snaps:', error);
        grid.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Could not load snaps. Make sure snaps.json exists.</p>';
    }
}

// Initialize snaps if on snaps page
if (document.getElementById('snapsGrid')) {
    loadSnaps();
}