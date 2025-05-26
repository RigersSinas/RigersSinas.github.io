// Create a namespace for our Parallel Shearsort implementation
window.parallelShearsort = (function() {
    // Θα επαναχρησιμοποιήσουμε όλες τις σταθερές και τη βασική δομή από το αρχικό shearsort
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const phaseInfo = document.getElementById('phaseInfo');
    const stepControls = document.querySelector('.step-controls');
    const phaseNavigation = document.querySelector('.phase-navigation');
    const phaseButtons = document.getElementById('phase-buttons');
    const totalCellsEl = document.getElementById('total-cells');
    const currentPhaseEl = document.getElementById('current-phase');
    const maxPhasesEl = document.getElementById('max-phases');
    
    const workerCountEl = document.getElementById('worker-count');
    const sortTimeEl = document.getElementById('sort-time');
    
    // State variables
    let size;
    let tileSize;
    let grid = [];
    let previousGrid = [];
    let gridHistory = [];
    let currentPhase = 0;
    let maxPhase = 0;
    let theoreticalMaxPhases;
    let isStepMode = false;
    let isEditMode = true;
    let currentLanguage = 'en';
    let sortingInterval;
    let workers = []; // Αποθήκευση των web workers
    let isSorting = false;
    let sortStartTime; // Μέτρηση χρόνου ταξινόμησης
    let sortEndTime;
    let maxWorkers; // Μέγιστος αριθμός workers (βάσει υπολογιστή)
    
    // Αντιγράφουμε τις μεταφράσεις από το αρχικό αρχείο
    const translations = {
        en: {
            title: 'Parallel Shearsort',
            aboutTitle: 'About the app',
            aboutText: 'This game-like interactive web app demonstrates the parallel implementation of the Shearsort algorithm for 2D meshes, utilizing web workers for true parallelism.',
            howToUseTitle: 'How to use',
            howToUseText: 'First define and visualize the mesh: select its dimension by the dropdown menu, and either let the app fill it for you automatically with random black and white cells or fill in your own pattern. By clicking Sort, you see the algorithm running in parallel. By clicking StS, you can run the algorithm in a step-by-step fashion using the Next - Previous buttons.',
            howItWorksTitle: 'How it works',
            howItWorksText: 'The algorithm alternately sorts rows and columns of the mesh in parallel. All of the rows are sorted in phases 1, 3, . . . , log²N + 1. All of the columns are sorted in phases 2, 4, . . . , log²N. The columns are sorted so that smaller numbers move upward. The odd rows (1, 3, . . . , [N-1]) are sorted so that smaller numbers move leftward, and the even rows (2, 4, . . . , [N]) are sorted in reverse order.',
            whyBWTitle: 'Why B&W',
            whyBWText: 'Shearsort correctly sorts every input sequence. However, all input sequences – no matter what their exact values are – can always be mapped to appropriately generated sequences of zeros and ones.',
            resetBtn: 'Reset',
            sortBtn: 'Sort',
            stepBtn: 'StS',
            prevBtn: 'Previous',
            nextBtn: 'Next',
            randomMesh: 'Random mesh',
            editMode: 'Edit mode: Click cells to toggle',
            rowSorting: 'Phase {0}: Parallel Row sorting.<br>In odd rows smaller numbers move leftward.<br>In even rows smaller numbers move rightward.',
            columnSorting: 'Phase {0}: Parallel Column sorting.<br>Smaller numbers move upward.',
            meshSorted: 'Mesh sorted in parallel.<br>Numbers appear in snakelike order.',
            totalCells: 'Total cells: {0}',
            currentPhase: 'Current phase: {0}',
            maxPhases: 'Max phases: {0}'
        },
        el: {
            title: 'Παράλληλο Shearsort',
            aboutTitle: 'Σχετικά με την εφαρμογή',
            aboutText: 'Αυτή η διαδραστική εφαρμογή λειτουργεί ως επίδειξη της παράλληλης υλοποίησης του αλγορίθμου Shearsort για δισδιάστατα πλέγματα, χρησιμοποιώντας web workers για πραγματικό παραλληλισμό.',
            howToUseTitle: 'Οδηγίες χρήσης',
            howToUseText: 'Πρώτα ορίστε και οπτικοποιήστε το πλέγμα: επιλέξτε τις διαστάσεις του από το αναπτυσσόμενο μενού και είτε αφήστε την εφαρμογή να το γεμίσει αυτόματα με τυχαία μαύρα και λευκά κελιά είτε συμπληρώστε το δικό σας μοτίβο. Πατώντας Ταξινόμηση, βλέπετε τον αλγόριθμο να εκτελείται παράλληλα. Πατώντας ΒπΒ, μπορείτε να εκτελέσετε τον αλγόριθμο βήμα προς βήμα χρησιμοποιώντας τα κουμπιά Επόμενο - Προηγούμενο.',
            howItWorksTitle: 'Πώς λειτουργεί',
            howItWorksText: 'Ο αλγόριθμος ταξινομεί εναλλάξ σειρές και στήλες του πλέγματος παράλληλα. Όλες οι σειρές ταξινομούνται στις φάσεις 1, 3, ..., log²N + 1. Όλες οι στήλες ταξινομούνται στις φάσεις 2, 4, ..., log²N. Οι στήλες ταξινομούνται έτσι ώστε οι μικρότεροι αριθμοί να μετακινούνται προς τα πάνω. Οι περιττές σειρές (1, 3, ..., [N-1]) ταξινομούνται έτσι ώστε οι μικρότεροι αριθμοί να μετακινούνται προς τα αριστερά, και οι ζυγές σειρές (2, 4, ..., [N]) ταξινομούνται με αντίστροφη σειρά.',
            whyBWTitle: 'Γιατί Ά&Μ',
            whyBWText: 'Ο Shearsort ταξινομεί σωστά κάθε ακολουθία εισόδου. Ωστόσο, όλες οι ακολουθίες εισόδου - ανεξάρτητα από τις ακριβείς τιμές τους - μπορούν πάντα να αντιστοιχιστούν σε κατάλληλα δημιουργημένες ακολουθίες μηδενικών και μονάδων.',
            resetBtn: 'Επαναφορά',
            sortBtn: 'Ταξινόμηση',
            stepBtn: 'ΒπΒ',
            prevBtn: 'Προηγούμενο',
            nextBtn: 'Επόμενο',
            randomMesh: 'Τυχαίο πλέγμα',
            editMode: 'Λειτουργία επεξεργασίας: Κάντε κλικ στα κελιά για εναλλαγή',
            rowSorting: 'Φάση {0}: Παράλληλη ταξινόμηση σειρών.<br>Στις περιττές σειρές οι μικρότεροι αριθμοί κινούνται αριστερά.<br>Στις ζυγές σειρές οι μικρότεροι αριθμοί κινούνται δεξιά.',
            columnSorting: 'Φάση {0}: Παράλληλη ταξινόμηση στηλών.<br>Οι μικρότεροι αριθμοί κινούνται προς τα πάνω.',
            meshSorted: 'Το πλέγμα ταξινομήθηκε παράλληλα.<br>Οι αριθμοί εμφανίζονται με φιδοειδή σειρά.',
            totalCells: 'Συνολικά κελιά: {0}',
            currentPhase: 'Τρέχουσα φάση: {0}',
            maxPhases: 'Μέγιστες φάσεις: {0}'
        }
    };
    
    // Βοηθητική συνάρτηση για αντικατάσταση placeholders
    function formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    }
    
    // Δημιουργία αντικειμένου Blob για τον Worker
    function createSortWorkerBlob() {
        const workerCode = `
            self.onmessage = function(e) {
                const { data, isRow, rowOrColIndex, isOdd, batchId, workerId } = e.data;
                let sortedData = [...data];
                
                // Χρησιμοποιούμε διαφορετικούς αλγόριθμους ταξινόμησης ανάλογα με το μέγεθος
                // Για μικρά μεγέθη, η απλή sort είναι αρκετά γρήγορη
                if (isRow) {
                    // Ταξινόμηση γραμμών
                    if (isOdd) {
                        // Περιττές γραμμές: τα 0 πηγαίνουν αριστερά
                        sortedData.sort((a, b) => a - b);
                    } else {
                        // Ζυγές γραμμές: τα 0 πηγαίνουν δεξιά
                        sortedData.sort((a, b) => b - a);
                    }
                } else {
                    // Ταξινόμηση στηλών: τα 0 πηγαίνουν προς τα πάνω
                    sortedData.sort((a, b) => a - b);
                }
                
                // Επιστρέφουμε επιπλέον πληροφορίες για καλύτερη παρακολούθηση
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
    
    // Αρχικοποίηση του πλέγματος
    function initializeGrid() {
        // Παρόμοιο με το αρχικό, αλλά τώρα περιλαμβάνει τη δημιουργία των workers
        const gridSize = document.getElementById('gridSize').value;
        size = parseInt(gridSize, 10);
        tileSize = canvas.width / size;
        
        // Προσαρμόζουμε το μέγεθος του canvas ανάλογα με το μέγεθος του πλέγματος
        // για μεγαλύτερα πλέγματα
        if (size > 64) {
            // Διατηρούμε το ίδιο μέγεθος κελιού για όλα τα μεγέθη πλέγματος
            // Το ελάχιστο μέγεθος κελιού είναι 2 pixels
            tileSize = Math.max(2, Math.floor(canvas.width / size));
            canvas.width = canvas.height = size * tileSize;
        } else {
            tileSize = canvas.width / size;
        }
        
        // Αρχικοποίηση πλέγματος με τυχαία black and white κελιά
        grid = [];
        for (let i = 0; i < size; i++) {
            let row = [];
            for (let j = 0; j < size; j++) {
                row.push(Math.random() > 0.5 ? 1 : 0);
            }
            grid.push(row);
        }
        
        // Επαναφορά κατάστασης
        previousGrid = [];
        gridHistory = [JSON.parse(JSON.stringify(grid))];
        currentPhase = 0;
        maxPhase = 0;
        isEditMode = true;
        
        // Υπολογισμός θεωρητικών μέγιστων φάσεων
        theoreticalMaxPhases = 2 * Math.ceil(Math.log2(size)) + 1;
        
        // Ενημέρωση UI
        updateStatsUI();
        updatePhaseInfo(translations[currentLanguage].randomMesh);
        drawGrid();
        
        // Ενεργοποίηση του canvas click για επεξεργασία
        canvas.onclick = handleCanvasClick;
        
        // Αρχικοποίηση των workers - προσαρμόζουμε τον αριθμό βάσει μεγέθους πλέγματος
        initializeWorkers();
    }
    
    // Αρχικοποίηση των workers
    function initializeWorkers() {
        terminateAllWorkers(); // Τερματισμός προηγούμενων workers
        
        const workerBlob = createSortWorkerBlob();
        const workerBlobURL = URL.createObjectURL(workerBlob);
        
        workers = [];
        
        // Προσδιορισμός του βέλτιστου αριθμού workers
        // Αρχικά ελέγχουμε τον αριθμό των διαθέσιμων λογικών πυρήνων του επεξεργαστή
        const availableCores = navigator.hardwareConcurrency || 4;
        
        // Για μεγαλύτερα πλέγματα, χρησιμοποιούμε περισσότερους workers
        // Αλλά ποτέ περισσότερους από τους διαθέσιμους πυρήνες
        if (size <= 16) {
            maxWorkers = Math.min(availableCores, 4);
        } else if (size <= 32) {
            maxWorkers = Math.min(availableCores, 8);
        } else if (size <= 64) {
            maxWorkers = Math.min(availableCores, 12);
        } else {
            maxWorkers = availableCores;
        }
        
        // Δημιουργία των workers
        for (let i = 0; i < maxWorkers; i++) {
            const worker = new Worker(workerBlobURL);
            worker.id = i; // Προσθέτουμε ID για εύκολη αναφορά
            workers.push(worker);
        }
        
        // Ενημέρωση του UI με τον αριθμό των ενεργών workers
        if (workerCountEl) {
            workerCountEl.textContent = `Active Workers: ${workers.length}`;
        }
        
        // Καθαρισμός του Blob URL
        URL.revokeObjectURL(workerBlobURL);
    }
    
    // Τερματισμός όλων των workers
    function terminateAllWorkers() {
        workers.forEach(worker => worker.terminate());
        workers = [];
    }
    
    // Χειρισμός του click στο canvas
    function handleCanvasClick(event) {
        if (!isEditMode) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);
        
        if (row >= 0 && row < size && col >= 0 && col < size) {
            // Εναλλαγή της τιμής του κελιού
            grid[row][col] = grid[row][col] === 1 ? 0 : 1;
            drawGrid();
            
            // Ενημέρωση ιστορικού
            gridHistory = [JSON.parse(JSON.stringify(grid))];
            currentPhase = 0;
            maxPhase = 0;
            updateStatsUI();
        }
    }
    
    // Ενημέρωση των στατιστικών στο UI
    function updateStatsUI() {
        totalCellsEl.textContent = formatString(
            translations[currentLanguage].totalCells, 
            size * size
        );
        
        currentPhaseEl.textContent = formatString(
            translations[currentLanguage].currentPhase, 
            currentPhase + 1
        );
        
        maxPhasesEl.textContent = formatString(
            translations[currentLanguage].maxPhases, 
            maxPhase > 0 ? maxPhase + 1 : maxPhase
        );
    }
    
    // Έλεγχος αν το πλέγμα έχει αλλάξει
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
    
    // Αποθήκευση της τρέχουσας κατάστασης του πλέγματος
    function saveGridState() {
        previousGrid = JSON.parse(JSON.stringify(grid));
    }
    
    // Σχεδίαση του πλέγματος
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const showGridLines = size <= 32;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                ctx.fillStyle = grid[i][j] === 1 ? '#000' : '#fff';
                ctx.fillRect(j * tileSize, i * tileSize, tileSize, tileSize);
                
                if (showGridLines) {
                    ctx.strokeStyle = '#888';
                    ctx.strokeRect(j * tileSize, i * tileSize, tileSize, tileSize);
                }
            }
        }
        
        if (!showGridLines) {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    // Ενημέρωση πληροφοριών φάσης
    function updatePhaseInfo(message) {
        phaseInfo.innerHTML = message;
    }
    
    // Παράλληλη ταξινόμηση γραμμών με χρήση Workers και Promises
    async function sortRowsParallel() {
        // Καταγραφή χρόνου έναρξης για τη συγκεκριμένη φάση
        const phaseStartTime = performance.now();
        
        // Δημιουργούμε ένα μοναδικό ID για αυτή τη δέσμη εργασιών (batch)
        const batchId = Date.now();
        
        // Κατανέμουμε τις γραμμές στους workers χρησιμοποιώντας ένα σύστημα εξισορρόπησης φορτίου
        const totalRows = size;
        const rowsPerWorker = Math.ceil(totalRows / workers.length);
        
        // Δημιουργούμε ένα αντικείμενο για να παρακολουθούμε τα αποτελέσματα από κάθε worker
        const workerResults = new Map();
        workers.forEach(worker => workerResults.set(worker.id, []));
        
        // Δημιουργούμε ένα promise που θα επιλυθεί όταν όλες οι γραμμές έχουν ταξινομηθεί
        const sortPromise = new Promise((resolve) => {
            let completedRows = 0;
            
            // Ρυθμίζουμε το handler για τα μηνύματα από τους workers
            const messageHandler = (e) => {
                const { sortedData, rowOrColIndex, batchId: responseBatchId, workerId } = e.data;
                
                // Ελέγχουμε αν αυτή η απάντηση ανήκει στην τρέχουσα δέσμη
                if (responseBatchId === batchId) {
                    // Αποθηκεύουμε το αποτέλεσμα στον πίνακα grid
                    grid[rowOrColIndex] = sortedData;
                    
                    // Προσθέτουμε το αποτέλεσμα στα αποτελέσματα του συγκεκριμένου worker
                    const results = workerResults.get(workerId);
                    if (results) {
                        results.push(e.data);
                    }
                    
                    completedRows++;
                    
                    // Αν έχουν ολοκληρωθεί όλες οι γραμμές, επιλύουμε το promise
                    if (completedRows === totalRows) {
                        // Αφαιρούμε τους handlers από όλους τους workers
                        workers.forEach(worker => {
                            worker.removeEventListener('message', messageHandler);
                        });
                        
                        resolve();
                    }
                }
            };
            
            // Προσθέτουμε τον handler σε όλους τους workers
            workers.forEach(worker => {
                worker.addEventListener('message', messageHandler);
            });
            
            // Κατανέμουμε τις γραμμές στους workers
            for (let i = 0; i < totalRows; i++) {
                // Επιλέγουμε τον worker με κυκλική διαίρεση για εξισορρόπηση φορτίου
                const workerIndex = i % workers.length;
                const worker = workers[workerIndex];
                
                // Στέλνουμε τη γραμμή στον worker
                worker.postMessage({
                    data: grid[i],
                    isRow: true,
                    rowOrColIndex: i,
                    isOdd: (i % 2 === 0), // Το i + 1 είναι περιττό όταν το i είναι άρτιο
                    batchId,
                    workerId: worker.id
                });
            }
        });
        
        // Περιμένουμε να ολοκληρωθεί η ταξινόμηση
        await sortPromise;
        
        // Καταγραφή χρόνου ολοκλήρωσης
        const phaseEndTime = performance.now();
        const phaseDuration = phaseEndTime - phaseStartTime;
        
        // Ενημερώνουμε το UI με το χρόνο εκτέλεσης
        if (sortTimeEl) {
            sortTimeEl.textContent = `Last Sort Time: ${phaseDuration.toFixed(2)}ms`;
        }
        
        return phaseDuration;
    }
    
    // Παράλληλη ταξινόμηση στηλών με χρήση Workers και Promises
    async function sortColumnsParallel() {
        // Καταγραφή χρόνου έναρξης για τη συγκεκριμένη φάση
        const phaseStartTime = performance.now();
        
        // Δημιουργούμε ένα μοναδικό ID για αυτή τη δέσμη εργασιών
        const batchId = Date.now();
        
        // Κατανέμουμε τις στήλες στους workers
        const totalCols = size;
        
        // Δημιουργούμε ένα αντικείμενο για να παρακολουθούμε τα αποτελέσματα
        const workerResults = new Map();
        workers.forEach(worker => workerResults.set(worker.id, []));
        
        // Δημιουργούμε ένα promise που θα επιλυθεί όταν όλες οι στήλες έχουν ταξινομηθεί
        const sortPromise = new Promise((resolve) => {
            let completedCols = 0;
            
            // Ρυθμίζουμε το handler για τα μηνύματα από τους workers
            const messageHandler = (e) => {
                const { sortedData, rowOrColIndex, isRow, batchId: responseBatchId, workerId } = e.data;
                
                // Ελέγχουμε αν αυτή η απάντηση ανήκει στην τρέχουσα δέσμη
                if (responseBatchId === batchId && !isRow) {
                    // Αποθηκεύουμε το αποτέλεσμα στον πίνακα grid
                    const col = rowOrColIndex;
                    for (let i = 0; i < size; i++) {
                        grid[i][col] = sortedData[i];
                    }
                    
                    // Προσθέτουμε το αποτέλεσμα στα αποτελέσματα του συγκεκριμένου worker
                    const results = workerResults.get(workerId);
                    if (results) {
                        results.push(e.data);
                    }
                    
                    completedCols++;
                    
                    // Αν έχουν ολοκληρωθεί όλες οι στήλες, επιλύουμε το promise
                    if (completedCols === totalCols) {
                        // Αφαιρούμε τους handlers από όλους τους workers
                        workers.forEach(worker => {
                            worker.removeEventListener('message', messageHandler);
                        });
                        
                        resolve();
                    }
                }
            };
            
            // Προσθέτουμε τον handler σε όλους τους workers
            workers.forEach(worker => {
                worker.addEventListener('message', messageHandler);
            });
            
            // Κατανέμουμε τις στήλες στους workers
            for (let j = 0; j < totalCols; j++) {
                // Επιλέγουμε τον worker με κυκλική διαίρεση για εξισορρόπηση φορτίου
                const workerIndex = j % workers.length;
                const worker = workers[workerIndex];
                
                // Δημιουργούμε τη στήλη
                const column = [];
                for (let i = 0; i < size; i++) {
                    column.push(grid[i][j]);
                }
                
                // Στέλνουμε τη στήλη στον worker
                worker.postMessage({
                    data: column,
                    isRow: false,
                    rowOrColIndex: j,
                    isOdd: false, // Δεν χρησιμοποιείται για τις στήλες
                    batchId,
                    workerId: worker.id
                });
            }
        });
        
        // Περιμένουμε να ολοκληρωθεί η ταξινόμηση
        await sortPromise;
        
        // Καταγραφή χρόνου ολοκλήρωσης
        const phaseEndTime = performance.now();
        const phaseDuration = phaseEndTime - phaseStartTime;
        
        // Ενημερώνουμε το UI με το χρόνο εκτέλεσης
        if (sortTimeEl) {
            sortTimeEl.textContent = `Last Sort Time: ${phaseDuration.toFixed(2)}ms`;
        }
        
        return phaseDuration;
    }
    
    // Εκτέλεση ενός βήματος ταξινόμησης
    async function performStep() {
        if (currentPhase < theoreticalMaxPhases) {
            saveGridState();
            
            // Καταγραφή χρόνου έναρξης συνολικής ταξινόμησης αν είναι η πρώτη φάση
            if (currentPhase === 0) {
                sortStartTime = performance.now();
            }
            
            let phaseDuration = 0;
            
            if (currentPhase % 2 === 0) {
                // Ταξινόμηση γραμμών (φάσεις 0, 2, 4, ...)
                phaseDuration = await sortRowsParallel();
                updatePhaseInfo(formatString(
                    translations[currentLanguage].rowSorting,
                    currentPhase + 1
                ));
            } else {
                // Ταξινόμηση στηλών (φάσεις 1, 3, 5, ...)
                phaseDuration = await sortColumnsParallel();
                updatePhaseInfo(formatString(
                    translations[currentLanguage].columnSorting,
                    currentPhase + 1
                ));
            }
            
            // Αποθήκευση κατάστασης στο ιστορικό
            gridHistory.push(JSON.parse(JSON.stringify(grid)));
            
            if (gridHasChanged()) {
                currentPhase++;
                
                // Ενημέρωση μέγιστης φάσης αν η τρέχουσα φάση είναι υψηλότερη
                if (currentPhase > maxPhase) {
                    maxPhase = currentPhase;
                    // Επαναδημιουργία κουμπιών φάσης αν είμαστε σε step mode
                    if (isStepMode) {
                        createPhaseButtons();
                    }
                }
                
                updateStatsUI();
                
                // Έλεγχος αν πρέπει να σταματήσουμε νωρίτερα (ήδη ταξινομημένο)
                if (!gridHasChanged() && currentPhase < theoreticalMaxPhases) {
                    // Καταγραφή του συνολικού χρόνου αν έχουμε ολοκληρώσει την ταξινόμηση
                    sortEndTime = performance.now();
                    const totalDuration = sortEndTime - sortStartTime;
                    
                    if (sortTimeEl) {
                        sortTimeEl.textContent = `Total Sort Time: ${totalDuration.toFixed(2)}ms - Φάσεις: ${currentPhase}`;
                    }
                    
                    updatePhaseInfo(translations[currentLanguage].meshSorted);
                    if (isStepMode) {
                        updateActivePhaseButton();
                    }
                    return false; // Σήμα για διακοπή ταξινόμησης
                }
            } else {
                // Καταγραφή του συνολικού χρόνου αν έχουμε ολοκληρώσει την ταξινόμηση
                sortEndTime = performance.now();
                const totalDuration = sortEndTime - sortStartTime;
                
                if (sortTimeEl) {
                    sortTimeEl.textContent = `Total Sort Time: ${totalDuration.toFixed(2)}ms - Φάσεις: ${currentPhase}`;
                }
                
                updatePhaseInfo(translations[currentLanguage].meshSorted);
                if (isStepMode) {
                    updateActivePhaseButton();
                }
                return false; // Σήμα για διακοπή ταξινόμησης
            }
            
            if (isStepMode) {
                updateActivePhaseButton();
            }
            
            return true; // Συνέχιση ταξινόμησης
        } else {
            // Καταγραφή του συνολικού χρόνου αν έχουμε ολοκληρώσει την ταξινόμηση
            sortEndTime = performance.now();
            const totalDuration = sortEndTime - sortStartTime;
            
            if (sortTimeEl) {
                sortTimeEl.textContent = `Total Sort Time: ${totalDuration.toFixed(2)}ms - Φάσεις: ${currentPhase}`;
            }
            
            updatePhaseInfo(translations[currentLanguage].meshSorted);
            
            if (isStepMode) {
                updateActivePhaseButton();
            }
            
            return false; // Σήμα για διακοπή ταξινόμησης
        }
    }
    
    // Εκτέλεση ταξινόμησης μέχρι μια συγκεκριμένη φάση
    async function runUntilPhase(targetPhase) {
        // Συνέχιση μόνο αν πρέπει να προχωρήσουμε
        if (targetPhase <= currentPhase) return;
        
        // Απενεργοποίηση UI κατά τη διάρκεια επεξεργασίας
        canvas.style.cursor = "wait";
        document.body.style.pointerEvents = "none";
        
        try {
            while (currentPhase < targetPhase && currentPhase < theoreticalMaxPhases) {
                const continueSort = await performStep();
                drawGrid();
                
                if (!continueSort) {
                    break;
                }
                
                // Μικρή καθυστέρηση για να μην μπλοκάρει το UI
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        } finally {
            // Επανενεργοποίηση UI
            canvas.style.cursor = "pointer";
            document.body.style.pointerEvents = "auto";
        }
    }
    
    // Δημιουργία κουμπιών πλοήγησης φάσης
    function createPhaseButtons() {
        // Καθαρισμός υπαρχόντων κουμπιών
        phaseButtons.innerHTML = '';
        
        // Χρήση maxPhase + 1 για τον αριθμό των κουμπιών, ή τουλάχιστον 1
        const numButtons = Math.max(maxPhase + 1, 1);
        
        // Δημιουργία ενός κουμπιού για κάθε φάση
        for (let i = 1; i <= numButtons; i++) {
            const button = document.createElement('button');
            button.className = 'phase-btn';
            button.textContent = i;
            
            button.addEventListener('click', function() {
                // Όταν κάνουμε κλικ, πηγαίνουμε σε αυτή τη φάση
                if (i <= gridHistory.length) {
                    goToPhase(i - 1);
                } else {
                    // Αν το ιστορικό δεν υπάρχει ακόμα για αυτή τη φάση, εκτελούμε μέχρι αυτή τη φάση
                    runUntilPhase(i - 1);
                }
            });
            
            phaseButtons.appendChild(button);
        }
        
        // Προσθήκη event listeners στα κουμπιά πλοήγησης
        const prevAllBtn = document.querySelector('.nav-btn.prev-all');
        const nextAllBtn = document.querySelector('.nav-btn.next-all');
        
        if (prevAllBtn && nextAllBtn) {
            prevAllBtn.addEventListener('click', function() {
                goToPhase(0);
            });
            
            nextAllBtn.addEventListener('click', function() {
                runUntilPhase(maxPhase);
            });
        }
        
        // Ενημέρωση ενεργού κουμπιού
        updateActivePhaseButton();
    }
    
    // Ενημέρωση ποιο κουμπί είναι ενεργό
    function updateActivePhaseButton() {
        const buttons = phaseButtons.querySelectorAll('.phase-btn');
        
        buttons.forEach((button, index) => {
            if (index === currentPhase) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // Μετάβαση σε συγκεκριμένη φάση
    function goToPhase(phase) {
        if (phase < 0 || phase >= gridHistory.length) return;
        
        currentPhase = phase;
        grid = JSON.parse(JSON.stringify(gridHistory[currentPhase]));
        updateStatsUI();
        
        // Ενημέρωση πληροφοριών φάσης
        if (currentPhase === 0) {
            updatePhaseInfo(translations[currentLanguage].randomMesh);
        } else if (currentPhase >= maxPhase || !gridHasChanged()) {
            updatePhaseInfo(translations[currentLanguage].meshSorted);
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
        updateActivePhaseButton();
    }
    
    // Επόμενο βήμα
    async function nextStep() {
        if (currentPhase >= maxPhase && gridHasChanged() === false) {
            // Ήδη ολοκληρωμένο και χωρίς αλλαγές
            updatePhaseInfo(translations[currentLanguage].meshSorted);
            return;
        }
        
        if (currentPhase < gridHistory.length - 1) {
            // Αν βλέπουμε ιστορικό, προχωράμε στην επόμενη αποθηκευμένη κατάσταση
            currentPhase++;
            grid = JSON.parse(JSON.stringify(gridHistory[currentPhase]));
            updateStatsUI();
            
            if (currentPhase >= maxPhase || !gridHasChanged()) {
                updatePhaseInfo(translations[currentLanguage].meshSorted);
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
            if (isStepMode) {
                updateActivePhaseButton();
            }
        } else {
            // Υπολογισμός νέας κατάστασης
            await performStep();
            drawGrid();
        }
    }
    
    // Προηγούμενο βήμα
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
        if (isStepMode) {
            updateActivePhaseButton();
        }
    }
    
    // Εναλλαγή λειτουργίας βήμα-προς-βήμα
    function toggleStepMode() {
        isStepMode = !isStepMode;
        
        if (isStepMode) {
            stepBtn.style.backgroundColor = '#c00';
            phaseNavigation.style.display = 'flex'; // Εμφάνιση πλοήγησης φάσης
            
            // Δημιουργία κουμπιών φάσης
            createPhaseButtons();
            
            // Καθαρισμός διαστήματος ταξινόμησης που εκτελείται
            if (sortingInterval) {
                clearInterval(sortingInterval);
                sortingInterval = null;
            }
            
            // Απενεργοποίηση επεξεργασίας σε λειτουργία βήμα-προς-βήμα
            isEditMode = false;
            canvas.onclick = null;
            
            // Ενημέρωση πληροφοριών φάσης αν δεν έχει γίνει ήδη
            if (currentPhase === 0) {
                updatePhaseInfo(translations[currentLanguage].randomMesh);
            } else if (currentPhase >= maxPhase) {
                updatePhaseInfo(translations[currentLanguage].meshSorted);
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
        } else {
            stepBtn.style.backgroundColor = '';
            phaseNavigation.style.display = 'none'; // Απόκρυψη πλοήγησης φάσης
            
            // Ενεργοποίηση επεξεργασίας μόνο αν δεν είμαστε στο τέλος της ταξινόμησης
            if (currentPhase < maxPhase) {
                isEditMode = true;
                canvas.onclick = handleCanvasClick;
                updatePhaseInfo(translations[currentLanguage].editMode);
            }
        }
    }
    
    // Ταξινόμηση όλων
    async function sortAll() {
        if (isStepMode) {
            toggleStepMode(); // Έξοδος από το βήμα-προς-βήμα αν είναι ενεργό
        }
        
        // Απενεργοποίηση επεξεργασίας κατά τη διάρκεια ταξινόμησης
        isEditMode = false;
        canvas.onclick = null;
        
        // Επαναφορά στην αρχική κατάσταση αν έχει ήδη ταξινομηθεί
        if (currentPhase >= maxPhase && maxPhase > 0) {
            reset();
            return;
        }
        
        // Έλεγχος αν η ταξινόμηση είναι ήδη σε εξέλιξη
        if (isSorting) return;
        
        isSorting = true;
        
        // Απενεργοποιούμε προσωρινά το UI
        canvas.style.cursor = "wait";
        document.body.style.pointerEvents = "none";
        
        try {
            // Καταγραφή συνολικού χρόνου έναρξης
            sortStartTime = performance.now();
            let hasChanges = true;
            
            // Συνεχίζουμε την ταξινόμηση μέχρι είτε να φτάσουμε τον μέγιστο αριθμό φάσεων
            // είτε να μην έχουμε πλέον αλλαγές
            while (currentPhase < theoreticalMaxPhases && hasChanges) {
                // Ενημερώνουμε το UI με την τρέχουσα φάση
                updatePhaseInfo(
                    currentPhase % 2 === 0 
                        ? formatString(translations[currentLanguage].rowSorting, currentPhase + 1)
                        : formatString(translations[currentLanguage].columnSorting, currentPhase + 1)
                );
                
                // Αφήνουμε λίγο χρόνο για να ενημερωθεί το UI
                await new Promise(resolve => setTimeout(resolve, 10));
                
                // Εκτελούμε το βήμα ταξινόμησης
                saveGridState();
                
                if (currentPhase % 2 === 0) {
                    await sortRowsParallel();
                } else {
                    await sortColumnsParallel();
                }
                
                // Σχεδιάζουμε το ενημερωμένο πλέγμα
                drawGrid();
                
                // Αποθήκευση της νέας κατάστασης στο ιστορικό
                gridHistory.push(JSON.parse(JSON.stringify(grid)));
                
                // Έλεγχος αν υπήρχαν αλλαγές σε αυτή τη φάση
                hasChanges = gridHasChanged();
                
                if (hasChanges) {
                    currentPhase++;
                    
                    // Ενημέρωση μέγιστης φάσης αν η τρέχουσα φάση είναι υψηλότερη
                    if (currentPhase > maxPhase) {
                        maxPhase = currentPhase;
                    }
                    
                    updateStatsUI();
                }
                
                // Αφήνουμε λίγο χρόνο μεταξύ των φάσεων για την οπτικοποίηση
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            
            // Καταγραφή συνολικού χρόνου ολοκλήρωσης
            sortEndTime = performance.now();
            const totalDuration = sortEndTime - sortStartTime;
            
            // Ενημερώνουμε το UI με το συνολικό χρόνο ταξινόμησης
            if (sortTimeEl) {
                sortTimeEl.textContent = `Total Sort Time: ${totalDuration.toFixed(2)}ms - Φάσεις: ${currentPhase}`;
            }
            
            // Ενημερώνουμε το UI ότι η ταξινόμηση ολοκληρώθηκε
            updatePhaseInfo(translations[currentLanguage].meshSorted);
            
        } catch (error) {
            console.error("Σφάλμα κατά την ταξινόμηση:", error);
        } finally {
            // Επανενεργοποίηση του UI
            canvas.style.cursor = "pointer";
            document.body.style.pointerEvents = "auto";
            isSorting = false;
        }
    }
    
    // Εναλλαγή γλώσσας
    function switchLanguage(lang) {
        if (currentLanguage === lang) return;
        
        currentLanguage = lang;
        
        // Ενημέρωση επιλογής γλώσσας
        if (lang === 'en') {
            langEN.classList.add('active');
            langEL.classList.remove('active');
        } else {
            langEL.classList.add('active');
            langEN.classList.remove('active');
        }
        
        // Ενημέρωση όλων των κειμένων
        title.textContent = translations[lang].title;
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
        
        // Ενημέρωση κειμένου τρέχουσας προβολής
        updateStatsUI();
        
        // Ενημέρωση πληροφοριών φάσης με βάση την τρέχουσα κατάσταση
        if (currentPhase === 0) {
            updatePhaseInfo(translations[lang].randomMesh);
        } else if (currentPhase >= maxPhase) {
            updatePhaseInfo(translations[lang].meshSorted);
        } else if (currentPhase % 2 === 0) {
            updatePhaseInfo(formatString(translations[lang].rowSorting, currentPhase));
        } else {
            updatePhaseInfo(formatString(translations[lang].columnSorting, currentPhase));
        }
    }
    
    // Επαναφορά της οπτικοποίησης
    function reset() {
        // Καθαρισμός διαστήματος ταξινόμησης που εκτελείται
        if (sortingInterval) {
            clearInterval(sortingInterval);
            sortingInterval = null;
        }
        
        // Διακοπή τυχόν εκτελούμενης ταξινόμησης
        isSorting = false;
        
        // Επανενεργοποίηση του UI
        canvas.style.cursor = "pointer";
        document.body.style.pointerEvents = "auto";
        
        initializeGrid();
        
        // Επανενεργοποίηση επεξεργασίας
        isEditMode = true;
        canvas.onclick = handleCanvasClick;
        
        // Εμφάνιση μηνύματος λειτουργίας επεξεργασίας
        updatePhaseInfo(translations[currentLanguage].editMode);
        
        // Επαναφορά στατιστικών χρόνου ταξινόμησης
        if (sortTimeEl) {
            sortTimeEl.textContent = `Last Sort Time: 0ms`;
        }
        
        // Επαναφορά λειτουργίας βήμα-προς-βήμα αλλά διατήρηση κατάστασης ορατότητας
        if (isStepMode) {
            // Ενημέρωση κουμπιών φάσης
            createPhaseButtons();
        }
    }
    
    // Ρύθμιση event listeners
    function setupEventListeners() {
        const langEN = document.getElementById('en');
        const langEL = document.getElementById('el');
        
        if (langEN && langEL) {
            langEN.addEventListener('click', function(e) {
                e.preventDefault();
                switchLanguage('en');
            });
            
            langEL.addEventListener('click', function(e) {
                e.preventDefault();
                switchLanguage('el');
            });
        }
        
        // Προσθήκη event listeners για το παράθυρο που θα εκτελεστεί κατά το κλείσιμο
        window.addEventListener('beforeunload', function() {
            terminateAllWorkers();
        });
    }
    
    // Αρχικοποίηση κατά τη φόρτωση
    window.addEventListener('load', function() {
        initializeGrid();
        setupEventListeners();
        updatePhaseInfo(translations[currentLanguage].editMode);
    });
    
    // Επιστροφή δημόσιων μεθόδων
    return {
        nextStep: nextStep,
        prevStep: prevStep,
        reset: reset,
        sortAll: sortAll,
        toggleStepMode: toggleStepMode
    };
})();
