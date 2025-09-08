(function(){
  const strip = document.getElementById('phase-buttons');
  const leftArrow  = document.querySelector('.phase-navigation .prev-all');  // << (υπάρχει από HTML)
  const rightArrow = document.querySelector('.phase-navigation .next-all');  // >> (υπάρχει από HTML)
  const row        = document.querySelector('.phase-navigation-row');
  const nav        = document.querySelector('.phase-navigation');

  if (!strip || !leftArrow || !rightArrow || !row || !nav) return;

  let placing = false;

  function placeLeftAndRightArrows() {
    if (placing) return;
    const phases = [...strip.querySelectorAll('.phase-btn')];
    if (!phases.length) return;

    placing = true;
    obs.disconnect();

    // ---- Αριστερό ζευγάρι: << + πρώτη φάση
    let leftWrap = strip.querySelector('.nowrap-pair-left');
    if (!leftWrap) {
      leftWrap = document.createElement('span');
      leftWrap.className = 'nowrap-pair-left';
    }
    const first = phases[0];
    if (first && first.parentElement !== leftWrap) {
      leftWrap.replaceChildren();
      leftWrap.appendChild(leftArrow); // υπάρχει ήδη με τους listeners από shearsort.js
      leftWrap.appendChild(first);
    }
    if (leftWrap.parentElement !== strip || strip.firstElementChild !== leftWrap) {
      strip.insertBefore(leftWrap, strip.firstChild);
    }

    let rightWrap = strip.querySelector('.nowrap-pair');
    if (!rightWrap) {
      rightWrap = document.createElement('span');
      rightWrap.className = 'nowrap-pair';
    }
    const buttonsNow = [...strip.querySelectorAll('.phase-btn')];
    const last = buttonsNow[buttonsNow.length - 1];
    if (last && last.parentElement !== rightWrap) {
      rightWrap.replaceChildren();
      rightWrap.appendChild(last);
      rightWrap.appendChild(rightArrow); // επίσης με τους listeners
    }
    if (rightWrap.parentElement !== strip || rightWrap !== strip.lastElementChild) {
      strip.appendChild(rightWrap);
    }

    obs.observe(strip, { childList: true });
    placing = false;
  }

  function fitStrip() {
    strip.style.transform = 'scale(1)'; // reset για σωστή μέτρηση
    const container = row;              // η γραμμή container
    const available = container.clientWidth || window.innerWidth;
    const needed = strip.scrollWidth;

    let scale = 1;
    if (needed > available) scale = available / needed;

    const MIN_SCALE = 0.6; // κάτω όριο
    scale = Math.max(MIN_SCALE, Math.min(1, scale));

    strip.style.transformOrigin = 'center';
    strip.style.transform = `scale(${scale})`;
  }

  // Παρακολούθηση αλλαγών στα κουμπιά φάσεων
  const obs = new MutationObserver(() => {
    setTimeout(() => {
      placeLeftAndRightArrows();
      fitStrip();
    }, 0);
  });
  obs.observe(strip, { childList: true });

  // Αρχικό placement & scaling
  setTimeout(() => {
    placeLeftAndRightArrows();
    fitStrip();
  }, 0);

  // Αναπροσαρμογή στο resize
  window.addEventListener('resize', fitStrip);

  // Hooks βημάτων
  document.getElementById('stepBtn')?.addEventListener('click', () => setTimeout(() => { placeLeftAndRightArrows(); fitStrip(); }, 0));
  document.getElementById('nextBtn')?.addEventListener('click', () => setTimeout(() => { placeLeftAndRightArrows(); fitStrip(); }, 0));
  document.getElementById('prevBtn')?.addEventListener('click', () => setTimeout(() => { placeLeftAndRightArrows(); fitStrip(); }, 0));

  // Προαιρετικό hook για shearsort.js
  window.positionShearsortArrows = function(){
    placeLeftAndRightArrows();
    fitStrip();
  };
})();
