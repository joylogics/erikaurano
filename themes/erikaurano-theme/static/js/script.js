document.addEventListener("DOMContentLoaded", function() {

  // Background Reel functionality
  initBackgroundReel();
  
  function initBackgroundReel() {
    const reelItems = document.querySelectorAll('.reel-item');
    if (reelItems.length === 0) return;
    
    let currentIndex = 0;
    const videoDuration = 10000; // 10 seconds per video segment
    let currentTimeout;
    
    function getCurrentDuration() {
      return videoDuration; // All items are now videos
    }
    
    function showNextItem() {
      // Stop current video if playing
      const currentItem = reelItems[currentIndex];
      const currentVideo = currentItem.querySelector('video');
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
      
      // Hide current item
      currentItem.classList.remove('active');
      
      // Move to next item (loop back to 0 when reaching the end)
      currentIndex = (currentIndex + 1) % reelItems.length;
      
      // Show new item
      const nextItem = reelItems[currentIndex];
      nextItem.classList.add('active');
      
      // Start video if it's a video item
      const nextVideo = nextItem.querySelector('video');
      if (nextVideo) {
        console.log('Background reel: Switching to next video');
        // Initialize HLS for background videos
        initVideoForReel(nextVideo).then(() => {
          console.log('Next video ready, attempting to play');
          return nextVideo.play();
        }).catch(e => {
          console.log('Video autoplay blocked, falling back to poster:', e);
          handleAutoplayFailure(nextVideo, nextItem);
        });
      }
      
      // Schedule next transition
      currentTimeout = setTimeout(showNextItem, getCurrentDuration());
    }
    
    function initVideoForReel(video) {
      const playlist = video.getAttribute('data-playlist');
      const src = video.getAttribute('src');
      
      // Ensure video is properly muted for autoplay
      video.muted = true;
      video.volume = 0;
      
      // Handle .ts files directly
      if (src && src.endsWith('.ts')) {
        // .ts files can be played directly
        video.load();
        return Promise.resolve();
      }
      
      // Handle HLS playlists
      if (playlist) {
        return new Promise((resolve, reject) => {
          if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hls = new Hls({
              debug: false,
              enableWorker: false, // Disable for background videos
              lowLatencyMode: false
            });
            
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              console.log('HLS manifest parsed, video ready');
              video.muted = true; // Ensure still muted after HLS init
              resolve();
            });
            
            hls.on(Hls.Events.ERROR, function(event, data) {
              console.warn('HLS error in background reel:', data);
              if (data.fatal) {
                reject(data);
              }
            });
            
            hls.loadSource(playlist);
            hls.attachMedia(video);
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = playlist;
            video.addEventListener('loadedmetadata', () => {
              console.log('Native HLS loaded');
              resolve();
            });
            video.addEventListener('error', reject);
          } else {
            reject(new Error('HLS not supported'));
          }
        });
      }
      
      return Promise.resolve();
    }
    
    // Initialize first video if it's a video
    const firstItem = reelItems[0];
    const firstVideo = firstItem.querySelector('video');
    if (firstVideo) {
              initVideoForReel(firstVideo).then(() => {
          return firstVideo.play();
        }).catch(e => {
          console.log('Video autoplay blocked, falling back to poster:', e);
          handleAutoplayFailure(firstVideo, firstItem);
        });
      }
    
    // Start the cycling if there are multiple items
    if (reelItems.length > 1) {
      currentTimeout = setTimeout(showNextItem, getCurrentDuration());
    }
    
    // Handle autoplay failure by falling back to poster images
    function handleAutoplayFailure(video, item) {
      console.log('Falling back to static background for item');
      video.style.display = 'none';
      
      // Create a fallback image element if poster exists
      const poster = video.getAttribute('poster');
      if (poster) {
        let fallbackImg = item.querySelector('.fallback-image');
        if (!fallbackImg) {
          fallbackImg = document.createElement('img');
          fallbackImg.className = 'fallback-image';
          fallbackImg.src = poster;
          fallbackImg.style.cssText = video.style.cssText;
          item.appendChild(fallbackImg);
        }
        fallbackImg.style.display = 'block';
      }
    }
    
    // Add click handler to try enabling video playback after user interaction
    document.addEventListener('click', function enableVideoAfterInteraction() {
      console.log('User interaction detected, attempting to enable video playback');
      reelItems.forEach(item => {
        const video = item.querySelector('video');
        const fallbackImg = item.querySelector('.fallback-image');
        if (video && fallbackImg && fallbackImg.style.display === 'block') {
          video.play().then(() => {
            console.log('Video playback enabled after user interaction');
            video.style.display = 'block';
            fallbackImg.style.display = 'none';
          }).catch(e => {
            console.log('Video still blocked after user interaction');
          });
        }
      });
      // Remove this listener after first interaction
      document.removeEventListener('click', enableVideoAfterInteraction);
    }, { once: true });

    // Preload video content
    reelItems.forEach(item => {
      const video = item.querySelector('video');
      if (video) {
        video.setAttribute('preload', 'metadata');
        // Initialize videos for better performance
        initVideoForReel(video);
      }
    });
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

  // Only on the home page, enable header click to replay animation
  var headerImg = document.getElementById("header-animation");
  if (headerImg.getAttribute("data-home") === "true") {
    // Home page: replay the animation on click.
    if (!headerImg.getAttribute("data-original-src")) {
      headerImg.setAttribute("data-original-src", headerImg.src);
    }
    headerImg.style.cursor = "pointer";
    headerImg.addEventListener("click", function() {
      var originalSrc = headerImg.getAttribute("data-original-src").split('?')[0];
      headerImg.src = originalSrc + '?v=' + Date.now();
    });
  } else {
    // Not on home: clicking header navigates to home.
    headerImg.style.cursor = "pointer";
    headerImg.addEventListener("click", function() {
      window.location.href = "/";
    });
  }

  if (headerImg.getAttribute("data-home") === "true") {
    // Save original src if not already stored
    if (!headerImg.getAttribute("data-original-src")) {
      headerImg.setAttribute("data-original-src", headerImg.src);
    }
    headerImg.style.cursor = "pointer";
    headerImg.addEventListener("click", function() {
      var originalSrc = headerImg.getAttribute("data-original-src").split('?')[0];
      headerImg.src = originalSrc + '?v=' + Date.now();
    });
  }

  // Clicking on a nav image should navigate to the same link as its sibling hypertext.
  var navImages = document.querySelectorAll('.nav-item .nav-image');
  if (document.body.classList.contains("home")) {
    navImages.forEach(function(navImage) {
      navImage.style.cursor = "pointer";
      navImage.addEventListener("click", function() {
        var navItem = navImage.closest('.nav-item');
        if (navItem) {
          var anchor = navItem.querySelector('.nav-text a');
          if (anchor && anchor.href) {
            window.location.href = anchor.href;
          }
        }
      });
    });
  }

  // Initialize HLS for film players
  var filmVideos = document.querySelectorAll('video[data-playlist]');
  filmVideos.forEach(function(video) {
    var playlist = video.getAttribute('data-playlist');

    if (typeof Hls === 'undefined') {
      console.error("HLS.js is not loaded!");
      return;
    }

    if (Hls.isSupported()) {
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
    }
  });

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

