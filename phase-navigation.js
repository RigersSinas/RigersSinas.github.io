(function () {
  const strip = document.getElementById('phase-buttons');
  const leftArrow  = document.querySelector('.phase-navigation .prev-all');  // <<
  const rightArrow = document.querySelector('.phase-navigation .next-all');  // >>
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

    // ---- Left pair: << + first phase
    let leftWrap = strip.querySelector('.nowrap-pair-left');
    if (!leftWrap) {
      leftWrap = document.createElement('span');
      leftWrap.className = 'nowrap-pair-left';
    }

    const first = phases[0];
    if (first && first.parentElement !== leftWrap) {
      leftWrap.replaceChildren();
      leftWrap.appendChild(leftArrow); // keep existing listeners
      leftWrap.appendChild(first);
    }

    if (leftWrap.parentElement !== strip || strip.firstElementChild !== leftWrap) {
      strip.insertBefore(leftWrap, strip.firstChild);
    }

    // ---- Right pair: last phase + >>
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
      rightWrap.appendChild(rightArrow); // keep existing listeners
    }

    if (rightWrap.parentElement !== strip || rightWrap !== strip.lastElementChild) {
      strip.appendChild(rightWrap);
    }

    obs.observe(strip, { childList: true });
    placing = false;
  }

  function fitStrip() {
    strip.style.transform = 'scale(1)'; // reset for correct measurement

    const containerW = row.clientWidth || window.innerWidth;

    const leftWrap = strip.querySelector('.nowrap-pair-left');
    const rightWrap = strip.querySelector('.nowrap-pair');

    const leftW = leftWrap ? leftWrap.getBoundingClientRect().width : 0;
    const rightW = rightWrap ? rightWrap.getBoundingClientRect().width : 0;

    // small safety padding for gaps/padding
    const EXTRA = 16;

    // real available width for the "middle" content
    const available = Math.max(1, containerW - leftW - rightW - EXTRA);

    // needed width for middle content (exclude wrappers)
    const neededTotal = strip.scrollWidth;
    const needed = Math.max(1, neededTotal - leftW - rightW);

    let scale = 1;
    if (needed > available) scale = available / needed;

    const MIN_SCALE = 0.6;
    scale = Math.max(MIN_SCALE, Math.min(1, scale));

    strip.style.transformOrigin = 'center';
    strip.style.transform = `scale(${scale})`;
  }

  const obs = new MutationObserver(() => {
    setTimeout(() => {
      placeLeftAndRightArrows();
      fitStrip();
    }, 0);
  });

  obs.observe(strip, { childList: true });

  // Initial placement & scaling
  setTimeout(() => {
    placeLeftAndRightArrows();
    fitStrip();
  }, 0);

  window.addEventListener('resize', fitStrip);

  // Step hooks
  document.getElementById('stepBtn')?.addEventListener('click', () =>
    setTimeout(() => { placeLeftAndRightArrows(); fitStrip(); }, 0)
  );
  document.getElementById('nextBtn')?.addEventListener('click', () =>
    setTimeout(() => { placeLeftAndRightArrows(); fitStrip(); }, 0)
  );
  document.getElementById('prevBtn')?.addEventListener('click', () =>
    setTimeout(() => { placeLeftAndRightArrows(); fitStrip(); }, 0)
  );

  // External hook (optional)
  window.positionShearsortArrows = function () {
    placeLeftAndRightArrows();
    fitStrip();
  };
})();
