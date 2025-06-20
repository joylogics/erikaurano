// Films filtering functionality - loaded separately to avoid blocking LCP
(function() {
  console.log('Films filter script loading...');
  
  const roleFilterBtns = document.querySelectorAll('.role-filters .filter-btn');
  const filmCards = document.querySelectorAll('.film-card');
  const filmsGrid = document.querySelector('.films-grid');

  console.log('Found', roleFilterBtns.length, 'filter buttons and', filmCards.length, 'film cards');

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

    // Set up click handlers
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

    // Enable grid transitions
    if (filmsGrid) {
      filmsGrid.classList.add('ready');
    }

    // Enable filter buttons now that functionality is loaded
    console.log('Enabling filter buttons...');
    roleFilterBtns.forEach(btn => {
      btn.classList.remove('loading');
      console.log('Enabled button:', btn.textContent);
    });

  } else if (filmsGrid) {
    // Enable transitions even if no filtering functionality
    filmsGrid.classList.add('ready');
  }
})(); 
