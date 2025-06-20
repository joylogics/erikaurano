document.addEventListener("DOMContentLoaded", function() {

  // WebP detection for background image optimization
  initWebPDetection();
  
  function initWebPDetection() {
    var webP = new Image();
    webP.onload = webP.onerror = function () {
      if (webP.height !== 2) {
        document.documentElement.classList.add('no-webp');
      }
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }

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

  // Initialize lazy video loading for YouTube/Vimeo
  initializeLazyVideos();
  
  // Initialize lazy HLS video loading  
  initializeLazyHLS();

  function initializeHLSPlayersAsync(videoArray, callback) {
    var filmVideos = videoArray || document.querySelectorAll('video[data-playlist]');
    
    // No video players found, skip HLS.js loading
    if (filmVideos.length === 0) {
      if (callback) callback();
      return;
    }

    console.log('Found', filmVideos.length, 'HLS video players, loading HLS.js...');

    // Set loading state on video players (only for non-lazy videos)
    if (!videoArray) {
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
    }

    // Check if HLS.js is already loaded
    if (typeof Hls !== 'undefined') {
      console.log('HLS.js already loaded, initializing players...');
      initializeHLSPlayers(filmVideos, false, callback);
      return;
    }

    // Load HLS.js asynchronously
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.onload = function() {
      console.log('HLS.js loaded, initializing players...');
      initializeHLSPlayers(filmVideos, false, callback);
    };
    script.onerror = function() {
      console.error('Failed to load HLS.js');
      // Fallback: try native HLS support
      initializeHLSPlayers(filmVideos, true, callback);
    };
    document.head.appendChild(script);
  }

  function initializeHLSPlayers(filmVideos, fallbackOnly = false, callback) {
    var completedVideos = 0;
    var totalVideos = filmVideos.length;
    
    function videoReady() {
      completedVideos++;
      if (completedVideos === totalVideos && callback) {
        callback();
      }
    }
    
    filmVideos.forEach(function(video) {
      var playlist = video.getAttribute('data-playlist');
      
      // Remove loading state (only for non-lazy videos)
      if (!video.hasAttribute('autoplay')) {
        video.style.opacity = '1';
        video.style.cursor = 'pointer';
        video.removeAttribute('disabled');
        
        // Remove loading indicator
        var loadingDiv = video.parentNode.querySelector('.hls-loading');
        if (loadingDiv) {
          loadingDiv.remove();
        }
      }

      if (!fallbackOnly && typeof Hls !== 'undefined' && Hls.isSupported()) {
        var hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          console.log('HLS manifest parsed for:', playlist);
          videoReady();
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
                videoReady(); // Still call ready even on error
                break;
            }
          }
        });

        hls.loadSource(playlist);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari or other native HLS players
        video.src = playlist;
        video.addEventListener('loadedmetadata', videoReady, { once: true });
      } else {
        console.error("HLS not supported in this browser.");
        // Show error state
        video.style.opacity = '0.5';
        video.setAttribute('title', 'Video playback not supported in this browser');
        videoReady(); // Still call ready even on error
      }
    });
    
    // Fallback timeout in case some videos don't load
    if (callback) {
      setTimeout(function() {
        if (completedVideos < totalVideos) {
          console.log('Some videos did not load in time, proceeding anyway');
          callback();
        }
      }, 5000);
    }
  }

  function initializeLazyVideos() {
    var lazyVideos = document.querySelectorAll('.lazy-video');
    
    console.log('Found', lazyVideos.length, 'lazy video containers');
    
    lazyVideos.forEach(function(videoContainer, index) {
      var embedUrl = videoContainer.getAttribute('data-embed-url');
      console.log('Lazy video', index + 1, ':', embedUrl);
      
      var thumbnail = videoContainer.querySelector('.video-thumbnail');
      var thumbnailImg = thumbnail.querySelector('img');
      var iframe = null;
      var isPreloaded = false;
      var hoverTimeout = null;
      
      // Check if thumbnail image loaded successfully
      if (thumbnailImg) {
        thumbnailImg.addEventListener('load', function() {
          console.log('Thumbnail loaded successfully for:', embedUrl);
        });
        thumbnailImg.addEventListener('error', function() {
          console.log('Thumbnail failed to load for:', embedUrl);
        });
      }
      
      // Hover to preload (Netflix-style)
      videoContainer.addEventListener('mouseenter', function() {
        if (isPreloaded || iframe) return;
        
        // Delay preload to avoid loading on accidental hover
        hoverTimeout = setTimeout(function() {
          console.log('Hover detected, starting preload for:', embedUrl);
          startPreload();
        }, 500); // 500ms hover delay
      });
      
      videoContainer.addEventListener('mouseleave', function() {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
      });
      
      function startPreload() {
        if (iframe || isPreloaded) return;
        
        console.log('Creating preload iframe for:', embedUrl);
        
        // Create iframe with autoplay (but muted) for real preloading
        iframe = document.createElement('iframe');
        var preloadUrl = embedUrl;
        
        // Add muted autoplay for real preloading
        if (embedUrl.includes('youtube.com')) {
          preloadUrl += '?autoplay=1&mute=1&rel=0&modestbranding=1';
        } else if (embedUrl.includes('vimeo.com')) {
          preloadUrl += '?autoplay=1&muted=1&title=0&byline=0&portrait=0';
        }
        
        iframe.src = preloadUrl;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        
        var titleEl = videoContainer.closest('.film-card, .film-single');
        if (titleEl) {
          var title = titleEl.querySelector('h1, h3');
          if (title) {
            iframe.title = title.textContent;
          }
        }
        
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.style.transition = 'opacity 0.3s ease';
        
        // Add iframe behind the thumbnail
        videoContainer.appendChild(iframe);
        
        // Add subtle loading indicator
        var loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'video-loading-indicator';
        loadingIndicator.style.position = 'absolute';
        loadingIndicator.style.top = '8px';
        loadingIndicator.style.right = '8px';
        loadingIndicator.style.background = 'rgba(0,0,0,0.6)';
        loadingIndicator.style.color = 'white';
        loadingIndicator.style.padding = '2px 6px';
        loadingIndicator.style.borderRadius = '3px';
        loadingIndicator.style.fontSize = '10px';
        loadingIndicator.style.zIndex = '10';
        loadingIndicator.style.opacity = '0.8';
        loadingIndicator.textContent = '⚡';
        thumbnail.appendChild(loadingIndicator);
        
        // Wait for video to start loading
        setTimeout(function() {
          isPreloaded = true;
          loadingIndicator.style.opacity = '0';
          setTimeout(function() {
            if (loadingIndicator.parentNode) {
              loadingIndicator.remove();
            }
          }, 300);
          console.log('Video preloaded for:', embedUrl);
        }, 2000);
      }
      
      // Click handler for instant reveal
      videoContainer.addEventListener('click', function() {
        console.log('Clicked video:', embedUrl);
        
        if (!iframe) {
          // If not preloaded, start immediate load
          console.log('Video not preloaded, starting immediate load');
          startPreload();
          
          // Wait a moment for iframe to start loading
          setTimeout(function() {
            revealVideo();
          }, 100);
        } else {
          // Instant reveal of preloaded video
          console.log('Revealing preloaded video');
          revealVideo();
        }
      });
      
      function revealVideo() {
        if (!iframe) return;
        
        // Unmute and ensure autoplay
        var playUrl = embedUrl;
        if (embedUrl.includes('youtube.com')) {
          playUrl += '?autoplay=1&rel=0&modestbranding=1';
        } else if (embedUrl.includes('vimeo.com')) {
          playUrl += '?autoplay=1&title=0&byline=0&portrait=0';
        }
        
        iframe.src = playUrl;
        
        // Smooth transition from thumbnail to video
        thumbnail.style.transition = 'opacity 0.3s ease';
        thumbnail.style.opacity = '0';
        
        setTimeout(function() {
          iframe.style.opacity = '1';
          iframe.style.pointerEvents = 'auto';
          videoContainer.classList.remove('lazy-video');
          videoContainer.classList.add('video-playing');
        }, 300);
      }
    });
    
    console.log('Initialized', lazyVideos.length, 'lazy video players with hover preloading');
  }

  function initializeLazyHLS() {
    var lazyHLSVideos = document.querySelectorAll('.lazy-hls');
    
    console.log('Found', lazyHLSVideos.length, 'lazy HLS video containers');
    
    lazyHLSVideos.forEach(function(videoContainer, index) {
      var playlist = videoContainer.getAttribute('data-playlist');
      var poster = videoContainer.getAttribute('data-poster');
      
      console.log('Lazy HLS video', index + 1, ':', playlist);
      
      var thumbnail = videoContainer.querySelector('.video-thumbnail');
      var thumbnailImg = thumbnail.querySelector('img');
      var video = null;
      var isPreloaded = false;
      var hoverTimeout = null;
      
      // Check if thumbnail image loaded successfully
      if (thumbnailImg) {
        thumbnailImg.addEventListener('load', function() {
          console.log('HLS thumbnail loaded successfully for:', playlist);
        });
        thumbnailImg.addEventListener('error', function() {
          console.log('HLS thumbnail failed to load for:', playlist);
        });
      }
      
      // Hover to preload (Netflix-style)
      videoContainer.addEventListener('mouseenter', function() {
        if (isPreloaded || video) return;
        
        // Delay preload to avoid loading on accidental hover
        hoverTimeout = setTimeout(function() {
          console.log('Hover detected, starting HLS preload for:', playlist);
          startHLSPreload();
        }, 800); // Slightly longer for HLS videos
      });
      
      videoContainer.addEventListener('mouseleave', function() {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
      });
      
      function startHLSPreload() {
        if (video || isPreloaded) return;
        
        console.log('Creating preload HLS video for:', playlist);
        
        // Add subtle loading indicator
        var loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'video-loading-indicator';
        loadingIndicator.style.position = 'absolute';
        loadingIndicator.style.top = '8px';
        loadingIndicator.style.right = '8px';
        loadingIndicator.style.background = 'rgba(0,0,0,0.6)';
        loadingIndicator.style.color = 'white';
        loadingIndicator.style.padding = '2px 6px';
        loadingIndicator.style.borderRadius = '3px';
        loadingIndicator.style.fontSize = '10px';
        loadingIndicator.style.zIndex = '10';
        loadingIndicator.style.opacity = '0.8';
        loadingIndicator.textContent = '⚡';
        thumbnail.appendChild(loadingIndicator);
        
        // Create video element for preloading
        video = document.createElement('video');
        video.poster = poster;
        video.setAttribute('data-playlist', playlist);
        video.muted = true; // Important for preloading
        video.preload = 'metadata';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        video.style.transition = 'opacity 0.3s ease';
        video.style.zIndex = '1'; // Keep video behind thumbnail
        
        // Add video behind thumbnail
        videoContainer.appendChild(video);
        
        // Initialize HLS for preloading
        initializeHLSPlayersAsync([video], function() {
          isPreloaded = true;
          loadingIndicator.style.opacity = '0';
          setTimeout(function() {
            if (loadingIndicator.parentNode) {
              loadingIndicator.remove();
            }
          }, 300);
          console.log('HLS video preloaded for:', playlist);
        });
      }
      
      // Click handler to load HLS video
      videoContainer.addEventListener('click', function() {
        console.log('Clicked HLS video:', playlist);
        
        if (!video) {
          // If not preloaded, start immediate load
          console.log('HLS video not preloaded, starting immediate load');
          startHLSPreload();
          
          // Wait a moment for video to start loading
          setTimeout(function() {
            revealHLSVideo();
          }, 200);
        } else {
          // Instant reveal of preloaded video
          console.log('Revealing preloaded HLS video');
          revealHLSVideo();
        }
      });
      
      function revealHLSVideo() {
        if (!video) return;
        
        // Enable controls and autoplay for playback
        video.controls = true;
        video.muted = false;
        
        // Smooth transition from thumbnail to video
        thumbnail.style.transition = 'opacity 0.3s ease';
        thumbnail.style.opacity = '0';
        
        setTimeout(function() {
          video.style.opacity = '1';
          video.style.pointerEvents = 'auto';
          videoContainer.classList.remove('lazy-hls');
          videoContainer.classList.add('video-playing');
          
          // Start playing
          video.play().catch(function(e) {
            console.log('Video autoplay blocked:', e);
          });
        }, 300);
      }
    });
    
    console.log('Initialized', lazyHLSVideos.length, 'lazy HLS video players');
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
  const filmsGrid = document.querySelector('.films-grid');

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

    // Enable grid transitions after a short delay to avoid render delay on page load
    setTimeout(() => {
      if (filmsGrid) {
        filmsGrid.classList.add('ready');
      }
    }, 100);
  } else if (filmsGrid) {
    // Enable transitions even if no filtering functionality
    setTimeout(() => {
      filmsGrid.classList.add('ready');
    }, 100);
  }

});

