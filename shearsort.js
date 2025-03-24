window.shearsort = (function() {
    // DOM Elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const phaseInfo = document.getElementById('phaseInfo');
    const stepControls = document.querySelector('.step-controls');
    const totalCellsEl = document.getElementById('total-cells');
    const currentPhaseEl = document.getElementById('current-phase');
    const maxPhasesEl = document.getElementById('max-phases');
    const stepBtn = document.getElementById('stepBtn');
    
    // Language Elements
    const langEN = document.getElementById('en');
    const langEL = document.getElementById('el');
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
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // State variables
    let size;
    let tileSize;
    let grid = [];
    let previousGrid = [];
    let gridHistory = [];
    let currentPhase = 0;
    let totalPhases;
    let isStepMode = false;
    let isEditMode = true;
    let currentLanguage = 'en';
    let sortingInterval;
    
    // Language translations
    const translations = {
        en: {
            title: 'Shearsort',
            aboutTitle: 'About the app',
            aboutText: 'This game-like interactive web app is intended to serve as assistive material for learning/training purposes regarding the study and analysis of the Shearsort parallel sorting algorithm for 2D meshes.',
            howToUseTitle: 'How to use',
            howToUseText: 'First define and visualize the mesh: select its dimension by the dropdown menu, and either let the app fill it for you automatically with random black and white cells or fill in your own pattern. By clicking Sort, you see the algorithm running. By clicking StS, you can run the algorithm in a step-by-step fashion using the Next - Previous buttons.',
            howItWorksTitle: 'How it works',
            howItWorksText: 'The algorithm alternately sorts rows and columns of the mesh. All of the rows are sorted in phases 1, 3, . . . , log²N + 1. All of the columns are sorted in phases 2, 4, . . . , log²N. The columns are sorted so that smaller numbers move upward. The odd rows (1, 3, . . . , [N-1]) are sorted so that smaller numbers move leftward, and the even rows (2, 4, . . . , [N]) are sorted in reverse order.',
            whyBWTitle: 'Why B&W',
            whyBWText: 'Shearsort correctly sorts every input sequence. However, all input sequences – no matter what their exact values are – can always be mapped to appropriately generated sequences of zeros and ones.',
            resetBtn: 'Reset',
            sortBtn: 'Sort',
            stepBtn: 'StS',
            prevBtn: 'Previous',
            nextBtn: 'Next',
            randomMesh: 'Random mesh',
            editMode: 'Edit mode: Click cells to toggle',
            rowSorting: 'Phase {0}: Row sorting.<br>In odd rows smaller numbers move leftward.<br>In even rows smaller numbers move rightward.',
            columnSorting: 'Phase {0}: Column sorting.<br>Smaller numbers move upward.',
            meshSorted: 'Mesh sorted.<br>Numbers appear in snakelike order.',
            totalCells: 'Total cells: {0}',
            currentPhase: 'Current phase: {0}',
            maxPhases: 'Max phases: {0}'
        },
        el: {
            title: 'Shearsort',
            aboutTitle: 'Σχετικά με την εφαρμογή',
            aboutText: 'Αυτή η διαδραστική εφαρμογή λειτουργεί ως βοηθητικό υλικό για εκπαιδευτικούς σκοπούς σχετικά με τη μελέτη και ανάλυση του αλγορίθμου παράλληλης ταξινόμησης Shearsort για δισδιάστατα πλέγματα.',
            howToUseTitle: 'Οδηγίες χρήσης',
            howToUseText: 'Πρώτα ορίστε και οπτικοποιήστε το πλέγμα: επιλέξτε τις διαστάσεις του από το αναπτυσσόμενο μενού και είτε αφήστε την εφαρμογή να το γεμίσει αυτόματα με τυχαία μαύρα και λευκά κελιά είτε συμπληρώστε το δικό σας μοτίβο. Πατώντας Ταξινόμηση, βλέπετε τον αλγόριθμο να εκτελείται. Πατώντας ΒπΒ, μπορείτε να εκτελέσετε τον αλγόριθμο βήμα προς βήμα χρησιμοποιώντας τα κουμπιά Επόμενο - Προηγούμενο.',
            howItWorksTitle: 'Πώς λειτουργεί',
            howItWorksText: 'Ο αλγόριθμος ταξινομεί εναλλάξ σειρές και στήλες του πλέγματος. Όλες οι σειρές ταξινομούνται στις φάσεις 1, 3, ..., log²N + 1. Όλες οι στήλες ταξινομούνται στις φάσεις 2, 4, ..., log²N. Οι στήλες ταξινομούνται έτσι ώστε οι μικρότεροι αριθμοί να μετακινούνται προς τα πάνω. Οι περιττές σειρές (1, 3, ..., [N-1]) ταξινομούνται έτσι ώστε οι μικρότεροι αριθμοί να μετακινούνται προς τα αριστερά, και οι ζυγές σειρές (2, 4, ..., [N]) ταξινομούνται με αντίστροφη σειρά.',
            whyBWTitle: 'Γιατί Ά&Μ',
            whyBWText: 'Ο Shearsort ταξινομεί σωστά κάθε ακολουθία εισόδου. Ωστόσο, όλες οι ακολουθίες εισόδου - ανεξάρτητα από τις ακριβείς τιμές τους - μπορούν πάντα να αντιστοιχιστούν σε κατάλληλα δημιουργημένες ακολουθίες μηδενικών και μονάδων.',
            resetBtn: 'Επαναφορά',
            sortBtn: 'Ταξινόμηση',
            stepBtn: 'ΒπΒ',
            prevBtn: 'Προηγούμενο',
            nextBtn: 'Επόμενο',
            randomMesh: 'Τυχαίο πλέγμα',
            editMode: 'Λειτουργία επεξεργασίας: Κάντε κλικ στα κελιά για εναλλαγή',
            rowSorting: 'Φάση {0}: Ταξινόμηση σειρών.<br>Στις περιττές σειρές οι μικρότεροι αριθμοί κινούνται αριστερά.<br>Στις ζυγές σειρές οι μικρότεροι αριθμοί κινούνται δεξιά.',
            columnSorting: 'Φάση {0}: Ταξινόμηση στηλών.<br>Οι μικρότεροι αριθμοί κινούνται προς τα πάνω.',
            meshSorted: 'Το πλέγμα ταξινομήθηκε.<br>Οι αριθμοί εμφανίζονται με φιδοειδή σειρά.',
            totalCells: 'Συνολικά κελιά: {0}',
            currentPhase: 'Τρέχουσα φάση: {0}',
            maxPhases: 'Μέγιστες φάσεις: {0}'
        }
    };
    
    // Initialize the visualization
    function initializeGrid() {
        const gridSize = document.getElementById('gridSize').value;
        size = parseInt(gridSize, 10);
        tileSize = canvas.width / size;
        
        // Initialize grid with random black and white cells
        grid = [];
        for (let i = 0; i < size; i++) {
            let row = [];
            for (let j = 0; j < size; j++) {
                row.push(Math.random() > 0.5 ? 1 : 0);
            }
            grid.push(row);
        }
        
        // Reset state
        previousGrid = [];
        gridHistory = [JSON.parse(JSON.stringify(grid))];
        currentPhase = 0;
        isEditMode = true;
        
        // Calculate total phases based on size
        totalPhases = Math.ceil(Math.log2(size) + 1) * 2;
        
        // Update UI
        updateStatsUI();
        updatePhaseInfo(translations[currentLanguage].randomMesh);
        drawGrid();
        
        // Enable canvas click when in edit mode
        canvas.onclick = handleCanvasClick;
    }
    
    // Handle canvas click for cell editing
    function handleCanvasClick(event) {
        if (!isEditMode) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);
        
        if (row >= 0 && row < size && col >= 0 && col < size) {
            // Toggle cell value
            grid[row][col] = grid[row][col] === 1 ? 0 : 1;
            drawGrid();
            
            // Update history
            gridHistory = [JSON.parse(JSON.stringify(grid))];
        }
    }
    
    // Format string with replacements
    function formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    }
    
    // Update UI statistics
    function updateStatsUI() {
        totalCellsEl.textContent = formatString(
            translations[currentLanguage].totalCells, 
            size * size
        );
        
        currentPhaseEl.textContent = formatString(
            translations[currentLanguage].currentPhase, 
            currentPhase
        );
        
        maxPhasesEl.textContent = formatString(
            translations[currentLanguage].maxPhases, 
            totalPhases
        );
    }
    
    // Check if grid has changed
    function gridHasChanged() {
        if (previousGrid.length === 0) return true;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (grid[i][j] !== previousGrid[i][j]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Save current grid state
    function saveGridState() {
        previousGrid = JSON.parse(JSON.stringify(grid));
    }
    
    // Draw the grid
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                ctx.fillStyle = grid[i][j] === 1 ? '#000' : '#fff';
                ctx.fillRect(j * tileSize, i * tileSize, tileSize, tileSize);
                ctx.strokeStyle = '#888';
                ctx.strokeRect(j * tileSize, i * tileSize, tileSize, tileSize);
            }
        }
    }
    
    // Update phase information display
    function updatePhaseInfo(message) {
        phaseInfo.innerHTML = message;
    }
    
    // Perform a single sorting step
    function performStep() {
        if (currentPhase < totalPhases) {
            saveGridState();
            
            if (currentPhase % 2 === 0) {
                sortRows();
                updatePhaseInfo(formatString(
                    translations[currentLanguage].rowSorting,
                    currentPhase + 1
                ));
            } else {
                sortColumns();
                updatePhaseInfo(formatString(
                    translations[currentLanguage].columnSorting,
                    currentPhase + 1
                ));
            }
            
            // Save state in history
            gridHistory.push(JSON.parse(JSON.stringify(grid)));
            
            if (gridHasChanged()) {
                currentPhase++;
                updateStatsUI();
            } else {
                updatePhaseInfo(translations[currentLanguage].meshSorted);
                currentPhase = totalPhases; // Force end of sorting
                updateStatsUI();
                return false; // Signal to stop sorting
            }
            
            return true; // Continue sorting
        } else {
            updatePhaseInfo(translations[currentLanguage].meshSorted);
            return false; // Signal to stop sorting
        }
    }
    
    // Execute next step
    function nextStep() {
        if (currentPhase >= totalPhases || gridHistory.length === 0) return;
        
        if (currentPhase < gridHistory.length - 1) {
            // If we're viewing history, advance to next saved state
            currentPhase++;
            grid = JSON.parse(JSON.stringify(gridHistory[currentPhase]));
            updateStatsUI();
            
            if (currentPhase % 2 === 0) {
                updatePhaseInfo(formatString(
                    translations[currentLanguage].rowSorting,
                    currentPhase
                ));
            } else {
                updatePhaseInfo(formatString(
                    translations[currentLanguage].columnSorting,
                    currentPhase
                ));
            }
            
            if (currentPhase === totalPhases) {
                updatePhaseInfo(translations[currentLanguage].meshSorted);
            }
            
            drawGrid();
        } else {
            // Calculate new state
            performStep();
            drawGrid();
        }
    }
    
    // Go to previous step
    function prevStep() {
        if (currentPhase <= 0 || gridHistory.length <= 1) return;
        
        currentPhase--;
        grid = JSON.parse(JSON.stringify(gridHistory[currentPhase]));
        updateStatsUI();
        
        if (currentPhase === 0) {
            updatePhaseInfo(translations[currentLanguage].randomMesh);
        } else if (currentPhase % 2 === 0) {
            updatePhaseInfo(formatString(
                translations[currentLanguage].rowSorting,
                currentPhase
            ));
        } else {
            updatePhaseInfo(formatString(
                translations[currentLanguage].columnSorting,
                currentPhase
            ));
        }
        
        drawGrid();
    }
    
    // Sort all at once
    function sortAll() {
        if (isStepMode) {
            toggleStepMode(); // Exit step mode if active
        }
        
        // Disable editing during sorting
        isEditMode = false;
        canvas.onclick = null;
        
        // Reset to initial state if already sorted
        if (currentPhase >= totalPhases) {
            reset();
            return;
        }
        
        // Clear any existing interval
        if (sortingInterval) {
            clearInterval(sortingInterval);
        }
        
        // Start automatic sorting
        sortingInterval = setInterval(() => {
            const continueSort = performStep();
            drawGrid();
            
            if (!continueSort) {
                clearInterval(sortingInterval);
                sortingInterval = null;
            }
        }, 300); // 300ms between steps
    }
    
    // Toggle step-by-step mode
    function toggleStepMode() {
        isStepMode = !isStepMode;
        
        if (isStepMode) {
            stepBtn.style.backgroundColor = '#c00';
            stepControls.style.display = 'block';
            
            // Clear any running sort interval
            if (sortingInterval) {
                clearInterval(sortingInterval);
                sortingInterval = null;
            }
            
            // Disable editing in step mode
            isEditMode = false;
            canvas.onclick = null;
        } else {
            stepBtn.style.backgroundColor = '';
            stepControls.style.display = 'none';
            
            // Enable editing when exiting step mode
            isEditMode = true;
            canvas.onclick = handleCanvasClick;
            updatePhaseInfo(translations[currentLanguage].editMode);
        }
    }
    
    // Sort rows
    function sortRows() {
        for (let i = 0; i < size; i++) {
            let isOddRow = (i + 1) % 2 === 1;
            
            if (isOddRow) {
                // Odd rows (1, 3, 5...): white (0) moves left
                grid[i].sort((a, b) => a - b);
            } else {
                // Even rows (2, 4, 6...): white (0) moves right
                grid[i].sort((a, b) => b - a);
            }
        }
    }
    
    // Sort columns
    function sortColumns() {
        for (let j = 0; j < size; j++) {
            let column = [];
            for (let i = 0; i < size; i++) {
                column.push(grid[i][j]);
            }
            // Sort columns upward (ascending)
            column.sort((a, b) => a - b);
            for (let i = 0; i < size; i++) {
                grid[i][j] = column[i];
            }
        }
    }
    
    // Switch language
    function switchLanguage(lang) {
        if (currentLanguage === lang) return;
        
        currentLanguage = lang;
        
        // Update language selection
        if (lang === 'en') {
            langEN.classList.add('active');
            langEL.classList.remove('active');
        } else {
            langEL.classList.add('active');
            langEN.classList.remove('active');
        }
        
        // Update all texts
        title.textContent = translations[lang].title;
        aboutTitle.textContent = translations[lang].aboutTitle;
        aboutText.textContent = translations[lang].aboutText;
        howToUseTitle.textContent = translations[lang].howToUseTitle;
        howToUseText.textContent = translations[lang].howToUseText;
        howItWorksTitle.textContent = translations[lang].howItWorksTitle;
        howItWorksText.textContent = translations[lang].howItWorksText;
        whyBWTitle.textContent = translations[lang].whyBWTitle;
        whyBWText.textContent = translations[lang].whyBWText;
        resetBtn.textContent = translations[lang].resetBtn;
        sortBtn.textContent = translations[lang].sortBtn;
        stepBtn.textContent = translations[lang].stepBtn;
        prevBtn.textContent = translations[lang].prevBtn;
        nextBtn.textContent = translations[lang].nextBtn;
        
        // Update current view text
        updateStatsUI();
        
        // Update phase info based on current state
        if (currentPhase === 0) {
            updatePhaseInfo(translations[lang].randomMesh);
        } else if (currentPhase >= totalPhases) {
            updatePhaseInfo(translations[lang].meshSorted);
        } else if (currentPhase % 2 === 0) {
            updatePhaseInfo(formatString(translations[lang].rowSorting, currentPhase));
        } else {
            updatePhaseInfo(formatString(translations[lang].columnSorting, currentPhase));
        }
    }
    
    // Reset the visualization
    function reset() {
        // Clear any running sort interval
        if (sortingInterval) {
            clearInterval(sortingInterval);
            sortingInterval = null;
        }
        
        initializeGrid();
        
        // Re-enable editing
        isEditMode = true;
        canvas.onclick = handleCanvasClick;
        
        // Display edit mode message
        updatePhaseInfo(translations[currentLanguage].editMode);
        
        // Reset step mode
        if (isStepMode) {
            toggleStepMode();
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        langEN.addEventListener('click', function(e) {
            e.preventDefault();
            switchLanguage('en');
        });
        
        langEL.addEventListener('click', function(e) {
            e.preventDefault();
            switchLanguage('el');
        });
    }
    
    // Initialize on load
    window.addEventListener('load', function() {
        initializeGrid();
        setupEventListeners();
        updatePhaseInfo(translations[currentLanguage].editMode);
    });
    
    // Return public methods
    return {
        nextStep: nextStep,
        prevStep: prevStep,
        reset: reset,
        sortAll: sortAll,
        toggleStepMode: toggleStepMode
    };
})();
