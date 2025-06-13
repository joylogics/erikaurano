document.addEventListener("DOMContentLoaded", function() {

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

});

