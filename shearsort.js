window.parallelShearsort = (function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  const phaseInfo = document.getElementById('phaseInfo');
  const phaseNavigation = document.querySelector('.phase-navigation');
  const phaseButtons = document.getElementById('phase-buttons');
  const totalCellsEl = document.getElementById('total-cells');
  const currentPhaseEl = document.getElementById('current-phase');
  const maxPhasesEl = document.getElementById('max-phases');

  const title = document.getElementById('title');
  const aboutTitle = document.getElementById('about-title');
  const aboutText = document.getElementById('about-text');
  const howToUseTitle = document.getElementById('how-to-use-title');
  const howToUseText = document.getElementById('how-to-use-text');
  const howItWorksTitle = document.getElementById('how-it-works-title');
  const howItWorksText = document.getElementById('how-it-works-text');
  const whyBWTitle = document.getElementById('why-bw-title');
  const whyBWText = document.getElementById('why-bw-text');

  const resetBtn = document.getElementById('resetBtn');
  const sortBtn = document.getElementById('sortBtn');
  const stepBtn = document.getElementById('stepBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const workerCountEl = document.getElementById('worker-count');
  const sortTimeEl = document.getElementById('sort-time');

  const langEN = document.getElementById('en');
  const langEL = document.getElementById('el');

  if (!canvas || !ctx) {
    console.error('[Shearsort] Missing <canvas id="canvas"> or 2D context.');
  }

  let size = 16;          
  let grid = [];
  let previousGrid = [];
  let gridHistory = [];
  let currentPhase = 0;   
  let maxPhase = 0;      
  let theoreticalMaxPhases;
  let isStepMode = false;
  let isEditMode = true;
  let currentLanguage = 'en';

  let workers = [];
  let maxWorkers = 0;
  let workerBlobURL = null;

  let isSorting = false;
  let sortStartTime;
  let sortEndTime;
  let isSorted = false;   

  let finalPhaseAdded = false;

  const uiPhase = (n) => n;

  const translations = {
    en: {
      title: 'Shearsort algorithm',
      aboutTitle: 'About the app',
      aboutText:
        'An interactive animated visualization of the Shearsort parallel sorting algorithm for 2D meshes, intended to support courses on parallel algorithms.',
      howToUseTitle: 'How to use',
      howToUseText:
        'Select your desired mesh size. You can modify the generated mesh by clicking cells to toggle between black and white. Select "Sort" to watch the mesh being gradually sorted by Shearsort. Select "Phases" to step through the procedure. "Reset" generates a new instance.',
      howItWorksTitle: 'How it works',
      howItWorksText:
        'Shearsort alternates between sorting rows and columns. Rows are sorted in odd phases (i.e., 1, 3, 5, ...). Columns are sorted in even phases (i.e., 2, 4, 6, ...). In columns smaller numbers move upward. In odd rows smaller numbers move leftward while in even rows smaller numbers move rightward. The numbers appear in a snakelike order fast enough, i.e., after at most logN + 1 phases for a mesh of N numbers. The odd–even transposition sort parallel algorithm is used for sorting independent rows or columns. For details: <a href="https://www.sciencedirect.com/book/9781483207728/introduction-to-parallel-algorithms-and-architectures" target="_blank" rel="noopener noreferrer">F. T. Leighton, <em>Introduction to Parallel Algorithms and Architectures</em>, Elsevier, 1992.</a>',
      whyBWTitle: 'Why black and white cells',
      whyBWText:
        'Shearsort correctly sorts every input sequence. However, all input sequences—regardless of their exact values—can be mapped to appropriately generated equivalent sequences of zeros and ones visualized as black and white cells.',
      resetBtn: 'Reset',
      sortBtn: 'Sort',
      stepBtn: 'Phases',
      prevBtn: 'Previous',
      nextBtn: 'Next',
      randomMesh: 'Random mesh',
      editMode: 'Edit mode: Click cells to toggle',
      rowSorting:
        'Phase {0}: Parallel Row sorting.<br>In odd rows smaller numbers move leftward.<br>In even rows smaller numbers move rightward.',
      columnSorting:
        'Phase {0}: Parallel Column sorting.<br>Smaller numbers move upward.',
      meshSorted: 'Mesh sorted in parallel.<br>Numbers appear in snakelike order.',
      currentPhase: 'Current phase: {0}',
      totalPhases: 'Total phases: {0}',
      maxPhases: 'Max phases: {0}',
    },
    el: {
      title: 'Αλγόριθμος Shearsort',
      aboutTitle: 'Σχετικά με την εφαρμογή',
      aboutText:
        'Μια διαδραστική animated απεικόνιση του παράλληλου αλγορίθμου ταξινόμησης Shearsort για δισδιάστατα πλέγματα, σχεδιασμένη για να υποστηρίζει μαθήματα πάνω σε παράλληλους αλγόριθμους.',
      howToUseTitle: 'Οδηγίες χρήσης',
      howToUseText:
        'Επιλέξτε τη διάσταση του πλέγματος που επιθυμείτε. Μπορείτε να τροποποιήσετε το πλέγμα κάνοντας κλικ στα κελιά του ώστε να αλλάξετε την τιμή τους από μαύρο σε άσπρο και αντίστροφα. Επιλέξτε «Ταξινόμηση» για να δείτε το πλέγμα να ταξινομείται σταδιακά με τον αλγόριθμο Shearsort. Επιλέξτε «Φάσεις» για να παρακολουθήσετε τη διαδικασία ταξινόμησης σε διαδοχικά στάδια. Η επιλογή «Επαναφορά» δημιουργεί ένα νέο τυχαίο πλέγμα.',
      howItWorksTitle: 'Πώς λειτουργεί',
      howItWorksText:
        'Ο αλγόριθμος Shearsort ταξινομεί το πλέγμα εναλλάσσοντας την ταξινόμηση γραμμών και στηλών. Οι γραμμές ταξινομούνται στις περιττές φάσεις (δηλ. 1, 3, 5, …). Οι στήλες ταξινομούνται στις άρτιες φάσεις (δηλ. 2, 4, 6, …). Στις στήλες, οι μικρότερες τιμές κινούνται προς τα πάνω. Στις περιττές γραμμές, οι μικρότερες τιμές κινούνται προς τα αριστερά, ενώ στις άρτιες γραμμές προς τα δεξιά. Οι αριθμοί τελικά εμφανίζονται με μορφή «φιδιού». Για την ταξινόμηση των ανεξάρτητων γραμμών ή στηλών χρησιμοποιείται ο παράλληλος αλγόριθμος odd–even transposition sort. Για λεπτομέρειες: <a href="https://www.sciencedirect.com/book/9781483207728/introduction-to-parallel-algorithms-and-architectures" target="_blank" rel="noopener noreferrer">F. T. Leighton, <em>Introduction to Parallel Algorithms and Architectures</em>, Elsevier, 1992.</a>',
      whyBWTitle: 'Γιατί μαύρα και λευκά κελιά',
      whyBWText:
        'Ο Shearsort ταξινομεί σωστά κάθε ακολουθία εισόδου, η οποία—ανεξάρτητα από τις συγκεκριμένες τιμές της—μπορεί να αντιστοιχιστεί σε ισοδύναμη ακολουθία από 0 και 1, η οποία απεικονίζεται ως κελιά με μαύρο και άσπρο χρώμα.',
      resetBtn: 'Επαναφορά',
      sortBtn: 'Ταξινόμηση',
      stepBtn: 'Φάσεις',
      prevBtn: 'Προηγούμενο',
      nextBtn: 'Επόμενο',
      randomMesh: 'Τυχαίο πλέγμα',
      editMode: 'Λειτουργία επεξεργασίας: Κάντε κλικ στα κελιά για εναλλαγή',
      rowSorting:
        'Φάση {0}: Παράλληλη ταξινόμηση γραμμών.<br>Στις περιττές γραμμές οι μικρότεροι αριθμοί κινούνται αριστερά.<br>Στις ζυγές γραμμές οι μικρότεροι αριθμοί κινούνται δεξιά.',
      columnSorting:
        'Φάση {0}: Παράλληλη ταξινόμηση στηλών.<br>Οι μικρότεροι αριθμοί κινούνται προς τα πάνω.',
      meshSorted:
        'Το πλέγμα ταξινομήθηκε παράλληλα.<br>Οι αριθμοί εμφανίζονται σε φιδοειδή διάταξη.',
     currentPhase: 'Τρέχουσα φάση: {0}',
     totalPhases: 'Σύνολο φάσεων: {0}',
     maxPhases: 'Μέγιστος # φάσεων: {0}',
    },
  };

  function formatString(str, ...args) {
    return str.replace(/{(\d+)}/g, (m, n) =>
      typeof args[n] !== 'undefined' ? args[n] : m
    );
  }

  function getCSSSize() {
    const computedH = parseFloat(getComputedStyle(canvas).height);
    if (!computedH || Number.isNaN(computedH)) {
      if (!canvas.style.height) canvas.style.height = '400px';
    }
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width || canvas.clientWidth || 400));
    const cssH = Math.max(1, Math.round(computedH || rect.height || canvas.clientHeight || 400));
    return { cssW, cssH };
  }

  function resizeCanvasToDPR() {
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, rect.width);
  const cssH = Math.max(1, rect.height);

  const pixelW = Math.max(1, Math.round(cssW * dpr));
  const pixelH = Math.max(1, Math.round(cssH * dpr));

  if (canvas.width !== pixelW)  canvas.width  = pixelW;
  if (canvas.height !== pixelH) canvas.height = pixelH;

  // ΖΩΓΡΑΦΙΖΟΥΜΕ σε device pixels: 1 μονάδα == 1 device pixel
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;

  drawGrid();
}



  function createSortWorkerBlob() {
  const workerCode = `
    function oddEvenTranspositionSort(arr, ascending = true) {
      const a = arr.slice();
      const n = a.length;
      for (let pass = 0; pass < n; pass++) {
        const start = (pass % 2 === 0) ? 0 : 1; // even pass: compare (0,1), (2,3)...
        for (let i = start; i + 1 < n; i += 2) {
          const left = a[i], right = a[i+1];
          const outOfOrder = ascending ? (left > right) : (left < right);
          if (outOfOrder) {
            a[i] = right; a[i+1] = left;
          }
        }
      }
      return a;
    }

    self.onmessage = function(e) {
      const { data, isRow, rowOrColIndex, isOdd, batchId, workerId } = e.data;
      let sortedData;
      if (isRow) {
        const ascending = !!isOdd;   // odd rows (1-based) => isOdd=true => ascending
        sortedData = oddEvenTranspositionSort(data, ascending);
      } else {
        sortedData = oddEvenTranspositionSort(data, true); // στήλες πάντα ascending
      }

      self.postMessage({
        sortedData,
        rowOrColIndex,
        isRow,
        batchId,
        workerId
      });
    };
  `;
  return new Blob([workerCode], { type: 'application/javascript' });
}


  function initializeWorkers() {
    terminateAllWorkers();
    const workerBlob = createSortWorkerBlob();
    workerBlobURL = URL.createObjectURL(workerBlob);
    workers = [];

    const availableCores = navigator.hardwareConcurrency || 4;
    if (size <= 16) maxWorkers = Math.min(availableCores, 4);
    else if (size <= 32) maxWorkers = Math.min(availableCores, 8);
    else if (size <= 64) maxWorkers = Math.min(availableCores, 12);
    else maxWorkers = availableCores;

    for (let i = 0; i < maxWorkers; i++) {
      const w = new Worker(workerBlobURL);
      w.id = i;
      workers.push(w);
    }
    if (workerCountEl) workerCountEl.textContent = `Active Workers: ${workers.length}`;
  }

  function terminateAllWorkers() {
    workers.forEach((w) => w.terminate());
    workers = [];
    if (workerBlobURL) {
      URL.revokeObjectURL(workerBlobURL);
      workerBlobURL = null;
    }
  }

  function initializeGrid() {
    const gridSizeEl = document.getElementById('gridSize');
    const gridSizeVal = gridSizeEl && gridSizeEl.value ? parseInt(gridSizeEl.value, 10) : 16;
    size = Number.isFinite(gridSizeVal) && gridSizeVal > 0 ? gridSizeVal : 16;

    grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => (Math.random() > 0.5 ? 1 : 0))
    );

    previousGrid = [];
    gridHistory = [deepCopy(grid)];
    currentPhase = 0;
    maxPhase = 0;
    isEditMode = true;
    isSorted = false;
    finalPhaseAdded = false;

    theoreticalMaxPhases = 2 * Math.ceil(Math.log2(size)) + 1;

    updateStatsUI();
    updatePhaseInfo(translations[currentLanguage].randomMesh);
    drawGrid();

    canvas.onclick = handleCanvasClick;

    initializeWorkers();
  }

  function deepCopy(x) { return JSON.parse(JSON.stringify(x)); }

  function drawGrid() {
  if (!ctx || !size) return;

  const pw = canvas.width;   
  const ph = canvas.height;  
  ctx.clearRect(0, 0, pw, ph);

  // Integer snapping σε device pixels
  const xEdges = new Array(size + 1);
  const yEdges = new Array(size + 1);
  for (let j = 0; j <= size; j++) xEdges[j] = Math.round((j * pw) / size);
  for (let i = 0; i <= size; i++) yEdges[i] = Math.round((i * ph) / size);

  const showGridLines = size <= 32;

  for (let i = 0; i < size; i++) {
    const y = yEdges[i];
    const h = yEdges[i + 1] - y;
    for (let j = 0; j < size; j++) {
      const x = xEdges[j];
      const w = xEdges[j + 1] - x;
      ctx.fillStyle = grid[i][j] === 1 ? '#000' : '#fff';
      ctx.fillRect(x, y, w, h);
      if (showGridLines) {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      }
    }
  }
}



  function phaseInfoForViewedIndex(viewIdx) {
    if (viewIdx === 0) return translations[currentLanguage].randomMesh;
    if (isSorted && finalPhaseAdded && viewIdx === maxPhase) {
      return translations[currentLanguage].meshSorted;
    }
    const displayPhase = viewIdx;     
    const producedBy = viewIdx - 1;   
    const key = (producedBy % 2 === 0) ? 'rowSorting' : 'columnSorting';
    return formatString(translations[currentLanguage][key], displayPhase);
  }
  function showInfoForCurrentView() {
    updatePhaseInfo(phaseInfoForViewedIndex(currentPhase));
  }

  function updatePhaseInfo(message) {
    if (phaseInfo) phaseInfo.innerHTML = message;
  }

function updateStatsUI() {
  const t = translations[currentLanguage];

  // Είμαστε στη "F" προβολή μόνο όταν έχει προστεθεί η τελική φάση
  // και ο χρήστης βλέπει το τελευταίο index (maxPhase).
  const viewingFinal = isSorted && finalPhaseAdded && currentPhase === maxPhase;

  // Current phase: αριθμός ή "F"
  const currentLabel = viewingFinal ? 'F' : String(uiPhase(currentPhase));

  // Total phases: να ΜΗΝ μετράει την F
  // Αν έχει προστεθεί η F, τότε το maxPhase περιλαμβάνει +1, άρα δείχνουμε maxPhase-1.
  const totalPhasesNumber = finalPhaseAdded ? Math.max(0, maxPhase - 1) : maxPhase;

  if (totalCellsEl) {
    totalCellsEl.textContent = formatString(t.totalCells, size * size);
  }

  if (currentPhaseEl) {
    currentPhaseEl.textContent = formatString(t.currentPhase, currentLabel);
  }

  const totalPhasesEl = document.getElementById('total-phases');
  if (totalPhasesEl) {
    // ΠΡΟΣΟΧΗ: εδώ χρησιμοποιούμε totalPhases key (όχι maxPhases)
    totalPhasesEl.textContent = formatString(t.totalPhases, String(uiPhase(totalPhasesNumber)));
  }

  if (maxPhasesEl) {
    maxPhasesEl.textContent = formatString(t.maxPhases, String(uiPhase(theoreticalMaxPhases)));
  }
}


  function setControlsEnabled(on) {
    [resetBtn, sortBtn, stepBtn, prevBtn, nextBtn].forEach((b) => b && (b.disabled = !on));
    if (canvas) canvas.style.cursor = on ? 'pointer' : 'wait';
  }

  function updateActivePhaseButton() {
    const buttons = phaseButtons ? phaseButtons.querySelectorAll('.phase-btn') : [];
    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === currentPhase);
    });
  }

  function fitPhaseButtons() {
    if (!phaseButtons || !phaseButtons.parentElement) return;
    const maxW = phaseButtons.parentElement.clientWidth || 1;
    const contentW = phaseButtons.scrollWidth || 1;
    const scale = Math.min(1, maxW / contentW);
    phaseButtons.style.transformOrigin = 'center';
    phaseButtons.style.transform = `scale(${scale})`;
  }

 function createPhaseButtons() {
  if (!phaseButtons) return;
  phaseButtons.innerHTML = '';

  const last = Math.max(maxPhase, 0);

  for (let i = 0; i <= last; i++) {
    const button = document.createElement('button');
    button.className = 'phase-btn';

    // Αν υπάρχει final phase και είναι το τελευταίο index -> δείξε "F"
    const isFinalButton = finalPhaseAdded && isSorted && i === maxPhase;
    button.textContent = isFinalButton ? 'F' : i;

    button.addEventListener('click', function () {
      const target = i;
      if (target < gridHistory.length) {
        goToPhase(target);
      } else {
        runUntilPhase(target);
      }
    });

    phaseButtons.appendChild(button);
  }

  updateActivePhaseButton();
  fitPhaseButtons();
}


  // ---- Input handlers ----
  function handleCanvasClick(event) {
    if (!isEditMode || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const { cssW, cssH } = getCSSSize();

    const scaleX = cssW / Math.max(1, rect.width);
    const scaleY = cssH / Math.max(1, rect.height);

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const col = Math.floor(x / (cssW / size));
    const row = Math.floor(y / (cssH / size));

    if (row >= 0 && row < size && col >= 0 && col < size) {
      grid[row][col] = grid[row][col] === 1 ? 0 : 1;
      drawGrid();
      gridHistory = [deepCopy(grid)];
      currentPhase = 0;
      maxPhase = 0;
      isSorted = false;
      finalPhaseAdded = false;
      updateStatsUI();
      showInfoForCurrentView();
      if (isStepMode) createPhaseButtons();
    }
  }

  function saveGridState() { previousGrid = deepCopy(grid); }
  function gridHasChanged() {
    if (!previousGrid.length) return true;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j] !== previousGrid[i][j]) return true;
      }
    }
    return false;
  }

  function addFinalPhaseOnce() {
    if (finalPhaseAdded) return;
    gridHistory.push(deepCopy(grid)); 
    maxPhase = currentPhase + 1;      
    finalPhaseAdded = true;
  }

  async function sortRowsParallel() {
    const phaseStartTime = performance.now();
    const batchId = Date.now();
    const totalRows = size;

    const sortPromise = new Promise((resolve) => {
      let completedRows = 0;
      const messageHandler = (e) => {
        const { sortedData, rowOrColIndex, batchId: respBatchId } = e.data;
        if (respBatchId === batchId) {
          grid[rowOrColIndex] = sortedData;
          completedRows++;
          if (completedRows === totalRows) {
            workers.forEach((w) => w.removeEventListener('message', messageHandler));
            resolve();
          }
        }
      };
      workers.forEach((w) => w.addEventListener('message', messageHandler));

      for (let i = 0; i < totalRows; i++) {
        const worker = workers[i % workers.length];
        worker.postMessage({
          data: grid[i],
          isRow: true,
          rowOrColIndex: i,
          isOdd: i % 2 === 0, 
          batchId,
          workerId: worker.id,
        });
      }
    });

    await sortPromise;

    const phaseDuration = performance.now() - phaseStartTime;
    if (sortTimeEl) sortTimeEl.textContent = `Last Sort Time: ${phaseDuration.toFixed(2)}ms`;
    return phaseDuration;
  }

  async function sortColumnsParallel() {
    const phaseStartTime = performance.now();
    const batchId = Date.now();
    const totalCols = size;

    const sortPromise = new Promise((resolve) => {
      let completedCols = 0;
      const messageHandler = (e) => {
        const { sortedData, rowOrColIndex, isRow, batchId: respBatchId } = e.data;
        if (respBatchId === batchId && !isRow) {
          const col = rowOrColIndex;
          for (let i = 0; i < size; i++) grid[i][col] = sortedData[i];
          completedCols++;
          if (completedCols === totalCols) {
            workers.forEach((w) => w.removeEventListener('message', messageHandler));
            resolve();
          }
        }
      };
      workers.forEach((w) => w.addEventListener('message', messageHandler));

      for (let j = 0; j < totalCols; j++) {
        const worker = workers[j % workers.length];
        const column = Array.from({ length: size }, (_, i) => grid[i][j]);
        worker.postMessage({
          data: column,
          isRow: false,
          rowOrColIndex: j,
          isOdd: false,
          batchId,
          workerId: worker.id,
        });
      }
    });

    await sortPromise;

    const phaseDuration = performance.now() - phaseStartTime;
    if (sortTimeEl) sortTimeEl.textContent = `Last Sort Time: ${phaseDuration.toFixed(2)}ms`;
    return phaseDuration;
  }

  async function performStep(inBatchMode = false) {
    if (currentPhase < theoreticalMaxPhases) {
      saveGridState();

      if (currentPhase === 0) {
        sortStartTime = performance.now();
      }

      if (currentPhase % 2 === 0) {
        await sortRowsParallel();
      } else {
        await sortColumnsParallel();
      }

      const changed = gridHasChanged();

      if (changed) {
        gridHistory.push(deepCopy(grid));
        currentPhase++;
        isSorted = false;

        if (currentPhase > maxPhase) {
          maxPhase = currentPhase;
          if (isStepMode && !inBatchMode) createPhaseButtons();
        }
        updateStatsUI();
        if (isStepMode && !inBatchMode) {
          showInfoForCurrentView();
          updateActivePhaseButton();
          fitPhaseButtons();
        }
        return true; 
      } else {
        sortEndTime = performance.now();
        const totalDuration = sortEndTime - sortStartTime;
        if (sortTimeEl) {
          sortTimeEl.textContent = `Total Sort Time: ${totalDuration.toFixed(2)}ms - Φάσεις: ${currentPhase}`;
        }
        isSorted = true;

        addFinalPhaseOnce();

        if (isStepMode && !inBatchMode) createPhaseButtons();
        updatePhaseInfo(translations[currentLanguage].meshSorted);
        updateStatsUI();
        return false; 
      }
    } else {
      
      sortEndTime = performance.now();
      const totalDuration = sortEndTime - sortStartTime;
      if (sortTimeEl) {
        sortTimeEl.textContent = `Total Sort Time: ${totalDuration.toFixed(2)}ms - Φάσεις: ${currentPhase}`;
      }
      isSorted = true;

      addFinalPhaseOnce();

      if (isStepMode && !inBatchMode) createPhaseButtons();
      updatePhaseInfo(translations[currentLanguage].meshSorted);
      updateStatsUI();
      return false;
    }
  }

  
  async function runUntilPhase(targetPhase) {
    if (targetPhase <= currentPhase) return;
    setControlsEnabled(false);
    try {
      while (currentPhase < targetPhase && currentPhase < theoreticalMaxPhases) {
        const cont = await performStep(true);
        drawGrid();
        if (!cont) break;
        await new Promise((r) => setTimeout(r, 0));
      }
      if (isStepMode) {
        createPhaseButtons();
        showInfoForCurrentView();
      }
    } finally {
      setControlsEnabled(true);
    }
  }

  async function runUntilComplete() {
    setControlsEnabled(false);
    try {
      let hasChanges = true;
      const startingPhase = currentPhase;
      while (currentPhase < theoreticalMaxPhases && hasChanges) {
        const cont = await performStep(true);
        drawGrid();
        if (!cont) hasChanges = false;
        if (currentPhase > startingPhase) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      isSorted = true;

      addFinalPhaseOnce();

      updateStatsUI();
      updatePhaseInfo(translations[currentLanguage].meshSorted);
      if (isStepMode) createPhaseButtons();

      
      currentPhase = maxPhase;
      grid = deepCopy(gridHistory[currentPhase]);
      drawGrid();
      
      updateStatsUI();
      showInfoForCurrentView();
      if (isStepMode) updateActivePhaseButton();
    } finally {
      setControlsEnabled(true);
    }
  }

  
  async function sortAll() {
    if (isStepMode) toggleStepMode(); 

    isEditMode = false;
    canvas.onclick = null;

    
    if (isSorted && finalPhaseAdded) {
      currentPhase = maxPhase;
      grid = deepCopy(gridHistory[currentPhase]);
      drawGrid();
      updateStatsUI(); 
      showInfoForCurrentView();
      if (isStepMode) updateActivePhaseButton();
      return;
    }

    if (isSorting) return;
    isSorting = true;

    setControlsEnabled(false);
    try {
      sortStartTime = performance.now();
      let hasChanges = true;

      while (currentPhase < theoreticalMaxPhases && hasChanges) {
        const key = (currentPhase % 2 === 0) ? 'rowSorting' : 'columnSorting';
        updatePhaseInfo(
          formatString(translations[currentLanguage][key], currentPhase + 1)
        );

        await new Promise(r => requestAnimationFrame(r));

        const cont = await performStep(true);
        drawGrid();

        if (!cont) hasChanges = false;

        await new Promise((r) => setTimeout(r, 120));
      }

      sortEndTime = performance.now();
      const totalDuration = sortEndTime - sortStartTime;
      if (sortTimeEl) {
        sortTimeEl.textContent = `Total Sort Time: ${totalDuration.toFixed(2)}ms - Φάσεις: ${currentPhase}`;
      }

      isSorted = true;
      addFinalPhaseOnce();

      updatePhaseInfo(translations[currentLanguage].meshSorted);
      updateStatsUI();
      if (isStepMode) createPhaseButtons();

      
      currentPhase = maxPhase;
      grid = deepCopy(gridHistory[currentPhase]);
      drawGrid();
      updateStatsUI(); 
      showInfoForCurrentView();
      if (isStepMode) updateActivePhaseButton();
    } catch (err) {
      console.error('Sorting error:', err);
    } finally {
      setControlsEnabled(true);
      isSorting = false;
    }
  }

  async function nextStep() {
    if (isSorted && finalPhaseAdded && currentPhase >= maxPhase) {
      updatePhaseInfo(translations[currentLanguage].meshSorted);
      return;
    }

    if (currentPhase < gridHistory.length - 1) {
      currentPhase++;
      grid = deepCopy(gridHistory[currentPhase]);
      updateStatsUI();
      drawGrid();
      showInfoForCurrentView();
      if (isStepMode) updateActivePhaseButton();
      return;
    }

    const cont = await performStep();
    drawGrid();
    showInfoForCurrentView();
  }

  function prevStep() {
    if (currentPhase <= 0 || gridHistory.length <= 1) return;
    currentPhase--;
    grid = deepCopy(gridHistory[currentPhase]);
    updateStatsUI();
    drawGrid();
    showInfoForCurrentView();
    if (isStepMode) updateActivePhaseButton();
  }

  function goToPhase(phase) {
    if (phase < 0 || phase >= gridHistory.length) return;
    currentPhase = phase;
    grid = deepCopy(gridHistory[currentPhase]);
    updateStatsUI();
    drawGrid();
    showInfoForCurrentView();
    updateActivePhaseButton();
  }

  function toggleStepMode() {
    isStepMode = !isStepMode;

    if (isStepMode) {
      stepBtn && (stepBtn.style.backgroundColor = '#c00');
      if (phaseNavigation) phaseNavigation.style.display = 'flex';
      createPhaseButtons();

      isEditMode = false;
      canvas.onclick = null;

      showInfoForCurrentView();
    } else {
      stepBtn && (stepBtn.style.backgroundColor = '');
      if (phaseNavigation) phaseNavigation.style.display = 'none';

      if (currentPhase < maxPhase) {
        isEditMode = true;
        canvas.onclick = handleCanvasClick;
        updatePhaseInfo(translations[currentLanguage].editMode);
      }
    }
  }


  function switchLanguage(lang) {
    if (currentLanguage === lang) return;
    currentLanguage = lang;

    if (langEN && langEL) {
      if (lang === 'en') {
        langEN.classList.add('active');
        langEL.classList.remove('active');
      } else {
        langEL.classList.add('active');
        langEN.classList.remove('active');
      }
    }

    if (title) title.textContent = translations[lang].title;
    if (aboutTitle) aboutTitle.textContent = translations[lang].aboutTitle;
    if (aboutText) aboutText.textContent = translations[lang].aboutText;
    if (howToUseTitle) howToUseTitle.textContent = translations[lang].howToUseTitle;
    if (howToUseText) howToUseText.textContent = translations[lang].howToUseText;
    if (howItWorksTitle) howItWorksTitle.textContent = translations[lang].howItWorksTitle;
    if (howItWorksText) howItWorksText.innerHTML = translations[lang].howItWorksText;
    if (whyBWTitle) whyBWTitle.textContent = translations[lang].whyBWTitle;
    if (whyBWText) whyBWText.textContent = translations[lang].whyBWText;
    if (resetBtn) resetBtn.textContent = translations[lang].resetBtn;
    if (sortBtn) sortBtn.textContent = translations[lang].sortBtn;
    if (stepBtn) stepBtn.textContent = translations[lang].stepBtn;
    if (prevBtn) prevBtn.textContent = translations[lang].prevBtn;
    if (nextBtn) nextBtn.textContent = translations[lang].nextBtn;

    updateStatsUI();
    showInfoForCurrentView();
    fitPhaseButtons();
  }


  function setupEventListeners() {
    if (langEN && langEL) {
      langEN.addEventListener('click', (e) => { e.preventDefault(); switchLanguage('en'); });
      langEL.addEventListener('click', (e) => { e.preventDefault(); switchLanguage('el'); });
    }

    if (phaseInfo) {
      phaseInfo.setAttribute('role', 'status');
      phaseInfo.setAttribute('aria-live', 'polite');
    }

    window.addEventListener('beforeunload', () => { terminateAllWorkers(); });

    const prevAll = document.querySelector('.nav-btn.prev-all');
    const nextAll = document.querySelector('.nav-btn.next-all');
    if (prevAll) prevAll.addEventListener('click', () => goToPhase(0));
    if (nextAll) nextAll.addEventListener('click', () => goToPhase(maxPhase));

    window.addEventListener('resize', () => {
      clearTimeout(window.__rszT);
      window.__rszT = setTimeout(() => {
        resizeCanvasToDPR();
        fitPhaseButtons();
      }, 120);
    });
  }


  function reset() {
    isSorting = false;
    setControlsEnabled(true);
    initializeGrid();
    isEditMode = true;
    canvas.onclick = handleCanvasClick;
    updatePhaseInfo(translations[currentLanguage].editMode);
    if (sortTimeEl) sortTimeEl.textContent = `Last Sort Time: 0ms`;
    if (isStepMode) createPhaseButtons();
    resizeCanvasToDPR();
    fitPhaseButtons();
  }

  
  window.addEventListener('load', function () {
    initializeGrid();
    resizeCanvasToDPR();
    setupEventListeners();
    updatePhaseInfo(translations[currentLanguage].editMode);
    fitPhaseButtons();
  });

 
  return {
    nextStep,
    prevStep,
    reset,
    sortAll,
    toggleStepMode,
  };
})();






