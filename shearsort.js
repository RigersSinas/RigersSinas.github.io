    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const phaseInfo = document.getElementById('phaseInfo');

    let size;
    let tileSize;
    let grid = [];
    let previousGrid = [];
    let currentPhase = 0;
    let totalPhases;

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
        
        currentPhase = 0;
        // Calculate total phases based on size
        totalPhases = Math.ceil(Math.log2(size) + 1) * 2;
        
        // Show initial "Random mesh" message
        phaseInfo.innerHTML = 'Random mesh';
        
        drawGrid();
    }

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

    function saveGridState() {
        previousGrid = grid.map(row => [...row]);
    }

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

    function updatePhaseInfo() {
        let info = '';
        if (!gridHasChanged()) {
            info = 'Mesh sorted.<br>Numbers appear in snakelike order.';
            currentPhase = totalPhases; // Force end of sorting
        } else if (currentPhase % 2 === 0) {
            info = 'Phase ' + (currentPhase + 1) + ': Row sorting.<br>' +
                   'In odd rows smaller numbers move leftward.<br>' +
                   'In even rows smaller numbers move rightward.';
        } else {
            info = 'Phase ' + (currentPhase + 1) + ': Column sorting.<br>' +
                   'Smaller numbers move upward.';
        }
        phaseInfo.innerHTML = info;
    }

    function nextStep() {
        if (currentPhase < totalPhases) {
            saveGridState(); // Save current state before modification
            
            if (currentPhase % 2 === 0) {
                sortRows();
            } else {
                sortColumns();
            }
            
            updatePhaseInfo();
            drawGrid();
            
            if (gridHasChanged()) {
                currentPhase++;
            }
        }
    }

    function sortRows() {
        for (let i = 0; i < size; i++) {
            let isOddRow = (i + 1) % 2 === 1;
            
            if (isOddRow) {
                // Odd rows: white (0) moves left
                grid[i].sort((a, b) => a - b);
            } else {
                // Even rows: white (0) moves right
                grid[i].sort((a, b) => b - a);
            }
            
            drawHighlightedRow(i);
        }
    }

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
            drawHighlightedColumn(j);
        }
    }

    function drawHighlightedRow(rowIndex) {
        drawGrid();
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, rowIndex * tileSize, canvas.width, tileSize);
    }

    function drawHighlightedColumn(colIndex) {
        drawGrid();
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(colIndex * tileSize, 0, tileSize, canvas.height);
    }

    function reset() {
        previousGrid = [];
        initializeGrid();
    }

    // Initialize on load
    window.addEventListener('load', initializeGrid);

window.onload = initializeGrid;