document.addEventListener("DOMContentLoaded", function() {

  // Background Video functionality
  initBackgroundVideo();
  
  function initBackgroundVideo() {
    const video = document.querySelector('.background-reel video');
    if (!video) return;
    
    // Ensure video is properly configured for autoplay
    video.muted = true;
    video.volume = 0;
    video.loop = true;
    
    // Try to play the video
    video.play().catch(e => {
      console.log('Video autoplay blocked:', e);
      // Video will remain paused until user interaction
    });
    
    // Add click handler to enable video playback after user interaction
    document.addEventListener('click', function enableVideoAfterInteraction() {
      if (video.paused) {
        video.play().then(() => {
          console.log('Video playback enabled after user interaction');
        }).catch(e => {
          console.log('Video still blocked after user interaction');
        });
      }
    }, { once: true });
  }

  // Replay-on-click for .webp images (except header and sub-header)
  var webpImages = document.querySelectorAll('img[src$=".webp"]');
  webpImages.forEach(function(img) {
    // Skip header and sub-header images so they don't replay on refresh.
    if (img.id === "header-animation" || img.id === "sub-header-animation") {
      return;
    }
    if (!img.getAttribute("data-original-src")) {
      img.setAttribute("data-original-src", img.src);
    }
    function replayAnimation() {
      var originalSrc = img.getAttribute("data-original-src").split('?')[0];
      img.src = originalSrc + '?v=' + Date.now();
    }
    // No auto-replay on load; only replay on click.
    img.addEventListener("click", function() {
      replayAnimation();
    });
  });

  // Header animation functionality is no longer needed since we're using text

  // Navigation image functionality is no longer needed since images are hidden

  // Initialize HLS for film players (async loading)
  initializeHLSPlayersAsync();

  function initializeHLSPlayersAsync() {
    var filmVideos = document.querySelectorAll('video[data-playlist]');
    
    // No video players found, skip HLS.js loading
    if (filmVideos.length === 0) {
      return;
    }

    console.log('Found', filmVideos.length, 'HLS video players, loading HLS.js...');

    // Set loading state on video players
    filmVideos.forEach(function(video) {
      video.style.opacity = '0.6';
      video.style.cursor = 'wait';
      video.setAttribute('disabled', true);
      
      // Add loading indicator
      var loadingDiv = document.createElement('div');
      loadingDiv.className = 'hls-loading';
      loadingDiv.style.position = 'absolute';
      loadingDiv.style.top = '50%';
      loadingDiv.style.left = '50%';
      loadingDiv.style.transform = 'translate(-50%, -50%)';
      loadingDiv.style.color = 'white';
      loadingDiv.style.background = 'rgba(0,0,0,0.7)';
      loadingDiv.style.padding = '8px 12px';
      loadingDiv.style.borderRadius = '4px';
      loadingDiv.style.fontSize = '14px';
      loadingDiv.textContent = 'Loading player...';
      loadingDiv.style.pointerEvents = 'none';
      
      // Insert loading indicator if parent has relative positioning
      var container = video.parentNode;
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      container.appendChild(loadingDiv);
    });

    // Load HLS.js asynchronously
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.onload = function() {
      console.log('HLS.js loaded, initializing players...');
      initializeHLSPlayers(filmVideos);
    };
    script.onerror = function() {
      console.error('Failed to load HLS.js');
      // Fallback: try native HLS support
      initializeHLSPlayers(filmVideos, true);
    };
    document.head.appendChild(script);
  }

  function initializeHLSPlayers(filmVideos, fallbackOnly = false) {
    filmVideos.forEach(function(video) {
      var playlist = video.getAttribute('data-playlist');
      
      // Remove loading state
      video.style.opacity = '1';
      video.style.cursor = 'pointer';
      video.removeAttribute('disabled');
      
      // Remove loading indicator
      var loadingDiv = video.parentNode.querySelector('.hls-loading');
      if (loadingDiv) {
        loadingDiv.remove();
      }

      if (!fallbackOnly && typeof Hls !== 'undefined' && Hls.isSupported()) {
        var hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
          if (data.fatal) {
            switch(data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error:", data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error:", data);
                hls.recoverMediaError();
                break;
              default:
                console.error("Fatal error:", data);
                hls.destroy();
                break;
            }
          }
        });

        hls.loadSource(playlist);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari or other native HLS players
        video.src = playlist;
      } else {
        console.error("HLS not supported in this browser.");
        // Show error state
        video.style.opacity = '0.5';
        video.setAttribute('title', 'Video playback not supported in this browser');
      }
    });
  }

  // Lightbox functionality for location gallery
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCurrent = document.getElementById('lightbox-current');
    const thumbnails = document.querySelectorAll('.gallery-thumbnail');
    
    let images = [];
    let currentIndex = 0;

    // Build images array from thumbnails
    thumbnails.forEach(thumbnail => {
      images.push(thumbnail.src);
    });

    function showImage(index) {
      currentIndex = index;
      lightboxImage.src = images[index];
      lightboxCurrent.textContent = index + 1;
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function hideImage() {
      lightbox.style.display = 'none';
      document.body.style.overflow = ''; // Restore scrolling
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(currentIndex);
    }

    // Event listeners
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', () => showImage(index));
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', hideImage);
    }
    
    if (lightboxNext) {
      lightboxNext.addEventListener('click', showNext);
    }
    
    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', showPrev);
    }

    // Close on background click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        hideImage();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') hideImage();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
      }
    });
  }

  // Animated film filtering functionality with 3-stage animation
  const roleFilterBtns = document.querySelectorAll('.role-filters .filter-btn');
  const filmCards = document.querySelectorAll('.film-card');

  if (roleFilterBtns.length > 0 && filmCards.length > 0) {
    function getCardPositions() {
      const positions = new Map();
      filmCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        positions.set(card, {
          x: rect.left,
          y: rect.top
        });
      });
      return positions;
    }

    function animateFilter(selectedRole) {
      // Determine which cards should be visible in the new state
      const currentlyVisible = [];
      const shouldBeVisible = [];
      const toHide = [];
      const toShow = [];
      
      filmCards.forEach(card => {
        const isCurrentlyVisible = !card.classList.contains('hiding') && card.style.display !== 'none';
        const shouldShow = selectedRole === 'all' || card.dataset.roles.includes(selectedRole);
        
        if (isCurrentlyVisible) currentlyVisible.push(card);
        if (shouldShow) shouldBeVisible.push(card);
        
        if (isCurrentlyVisible && !shouldShow) toHide.push(card);
        if (!isCurrentlyVisible && shouldShow) toShow.push(card);
      });

      const remainingCards = currentlyVisible.filter(card => !toHide.includes(card));

      // Record INITIAL positions of all remaining cards BEFORE any changes
      const initialPositions = new Map();
      remainingCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        initialPositions.set(card, {
          x: rect.left,
          y: rect.top
        });
      });

      // STAGE 1: Shrink and remove cards that shouldn't be visible
      if (toHide.length > 0) {
        toHide.forEach(card => {
          card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          card.style.transform = 'scale(0.8)';
          card.style.opacity = '0';
        });

        // Wait for shrink animation to complete
        setTimeout(() => {
          // Actually remove the cards from layout
          toHide.forEach(card => {
            card.style.display = 'none';
          });
          stage2();
        }, 300);
      } else {
        stage2();
      }

      function stage2() {
        // STAGE 2: Rearrange remaining cards using FLIP
        if (remainingCards.length > 0 || toShow.length > 0) {
          // Prepare spaces for new cards (but keep them invisible)
          toShow.forEach(card => {
            card.style.display = 'block';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            card.style.transition = 'none';
          });

          // Force layout recalculation
          document.body.offsetHeight;

          // Record final positions of remaining cards
          const finalPositions = new Map();
          remainingCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            finalPositions.set(card, {
              x: rect.left,
              y: rect.top
            });
          });

          // Apply FLIP to remaining cards
          remainingCards.forEach(card => {
            const initial = initialPositions.get(card);
            const final = finalPositions.get(card);
            
            if (initial && final) {
              const deltaX = initial.x - final.x;
              const deltaY = initial.y - final.y;
              
              // Only apply transform if there's actually movement
              if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                card.style.transition = 'none';
                card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
              }
            }
          });

          // Force layout
          document.body.offsetHeight;

          // Animate remaining cards to final positions
          remainingCards.forEach(card => {
            card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            card.style.transform = '';
          });

          // Wait for rearrangement to complete
          setTimeout(stage3, 600);
        } else {
          stage3();
        }
      }

      function stage3() {
        // STAGE 3: Grow in the new cards
        if (toShow.length > 0) {
          toShow.forEach(card => {
            card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.transform = 'scale(1)';
            card.style.opacity = '1';
          });
        }

        // Clean up all inline styles after animation completes
        setTimeout(() => {
          filmCards.forEach(card => {
            if (selectedRole === 'all' || card.dataset.roles.includes(selectedRole)) {
              card.style.display = 'block';
              card.style.opacity = '1';
              card.style.transform = '';
              card.style.transition = '';
            } else {
              card.style.display = 'none';
            }
          });
        }, 300);
      }
    }

    roleFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Don't animate if already active
        if (btn.classList.contains('active')) return;
        
        roleFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const selectedRole = btn.dataset.role;
        animateFilter(selectedRole);
      });
    });

    // Initialize all cards as visible
    filmCards.forEach(card => {
      card.style.display = 'block';
      card.style.opacity = '1';
      card.style.transform = '';
    });
  }

});

