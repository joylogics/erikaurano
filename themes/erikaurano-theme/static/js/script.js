document.addEventListener("DOMContentLoaded", function() {
  window.addEventListener("load", function() {
    var headerImg = document.getElementById("header-animation");
    var subHeaderImg = document.getElementById("sub-header-animation");
    var bodyContent = document.getElementById("body-content");

    // Reveal header animation
    headerImg.style.display = "block";
    headerImg.offsetHeight; // force reflow for transition
    headerImg.style.opacity = "1";

    // Get header animation duration (default 2500ms)
    var headerDuration = headerImg.getAttribute("data-duration");
    headerDuration = headerDuration ? parseInt(headerDuration, 10) : 2500;

    // After header animation, reveal sub-header and body content
    setTimeout(function() {
      if (subHeaderImg) {
        subHeaderImg.style.display = "block";
        subHeaderImg.offsetHeight; // force reflow
        subHeaderImg.style.opacity = "1";
      }
      if (bodyContent) {
        bodyContent.style.opacity = "1";
      }
    }, headerDuration);
  });

  // Replay-on-click for all .webp images
  var webpImages = document.querySelectorAll('img[src$=".webp"]');
  webpImages.forEach(function(img) {
    if (!img.getAttribute("data-original-src")) {
      img.setAttribute("data-original-src", img.src);
    }
    function replayAnimation() {
      var originalSrc = img.getAttribute("data-original-src").split('?')[0];
      img.src = originalSrc + '?v=' + Date.now();
    }
    replayAnimation();
    img.addEventListener("click", function() {
      replayAnimation();
    });
  });
});
