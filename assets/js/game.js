jQuery(document).ready(function($) {
    const WORD_LIST = ['CSS', 'HTML', 'JQUERY', 'WEB', 'JS'];
    const GRID_SIZE = 10;
    const DIRECTIONS = ['vertical', 'horizontal', 'diagonal'];

    const game = {
        config: {
            words: WORD_LIST,
            foundWords: [],
            placements: {},
            alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            score: 0
        },
        state: {
            dragging: false,
            selected: [],
            startCell: null
        }
    };

    // Initialize game
    function init() {
        const gridData = createGrid({
            words: game.config.words,
            size: GRID_SIZE,
            alphabet: game.config.alphabet,
            directions: DIRECTIONS
        });
        
        // Use placeAllWordsInGrid() to make sure all words are placed in the grid
        placeAllWordsInGrid(game.config.words, gridData.grid); 
    
        renderGrid(gridData.grid);
        setupEventHandlers();
        updateWordList();
        updateStatus('Drag to select words!');
    }

    // Grid creation using advanced placement algorithm
    function createGrid() {
        // Properly initialize a 2D grid filled with empty strings
        const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
        const used = {};
        let words = game.config.words.slice();
    
        words.forEach(word => {
            let placed = false;
    
            // Keep attempting to place the word until successful
            while (!placed) {
                const candidate = new Candidate(word, GRID_SIZE);
                if (tryPlaceWord(candidate, grid)) {
                    game.config.placements[word] = {
                        start: candidate.start,
                        direction: [candidate.ydir, candidate.xdir],
                        end: insertWordInGrid(candidate, grid)
                    };
                    placed = true;
                }
            }
        });
    
        return {
            grid: fillWithRandomChars(grid), // Fill empty spaces with random characters
            used: used
        };
    }

    class Candidate {
        constructor(word, size) {
            const dir = this.randomDirection();
            this.word = word.toUpperCase().split('');
            this.ydir = dir[0];
            this.xdir = dir[1];
            this.start = {
                row: Math.floor(Math.random() * size),
                col: Math.floor(Math.random() * size)
            };
        }

        randomDirection() {
            const dirs = ['S', 'O', 'SO', 'NO', 'W', 'N', 'SW', 'NW'];
            return dirs[Math.floor(Math.random() * dirs.length)].split('');
        }
    }

    function placeAllWordsInGrid(wordsList, grid) {
        const directions = ['E', 'W', 'S', 'N', 'NE', 'NW', 'SE', 'SW'];
        for (const word of wordsList) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
    
            while (!placed && attempts < maxAttempts) {
                const startRow = Math.floor(Math.random() * GRID_SIZE);
                const startCol = Math.floor(Math.random() * GRID_SIZE);
                const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
                const candidate = {
                    word: word,
                    start: { row: startRow, col: startCol },
                    xdir: randomDirection.includes('E') || randomDirection.includes('W') ? randomDirection : 'E',
                    ydir: randomDirection.includes('N') || randomDirection.includes('S') ? randomDirection : 'S',
                };
    
                if (tryPlaceWord(candidate, grid)) {
                    insertWordInGrid(candidate, grid);
                    placed = true;
                }
                attempts++;
            }
    
            if (!placed) {
                console.error(`Failed to place word: ${word}. Skipping...`);
            }
        }
    }
    
    function tryPlaceWord(candidate, grid) {
        let row = candidate.start.row;
        let col = candidate.start.col;
    
        for (const char of candidate.word) {
            if (row >= GRID_SIZE || col >= GRID_SIZE || row < 0 || col < 0) return false;
            if (grid[row][col] && grid[row][col] !== char) return false;
    
            row += { S: 1, N: -1, NE: -1, NW: -1, SE: 1, SW: 1 }[candidate.ydir] || 0;
            col += { E: 1, W: -1, NE: 1, NW: -1, SE: 1, SW: -1 }[candidate.xdir] || 0;
        }
        return true;
    }

    function insertWordInGrid(candidate, grid) {
        let row = candidate.start.row;
        let col = candidate.start.col;
        
        for (const char of candidate.word) {
            grid[row][col] = char;
            row += { S: 1, N: -1, NE: -1, NW: -1, SE: 1, SW: 1 }[candidate.ydir] || 0;
            col += { E: 1, W: -1, NE: 1, NW: -1, SE: 1, SW: -1 }[candidate.xdir] || 0;
        }
    }

    function fillWithRandomChars(grid) {
        return grid.map(row => {
            return Array(GRID_SIZE).fill().map((_, i) => 
                row[i] || game.config.alphabet[Math.floor(Math.random() * 26)]
            );
        });
    }

    // Rendering functions
    function renderGrid(gridData) {
        const grid = $('#grid');
        grid.empty()
            .css({
                'display': 'grid',
                'grid-template-columns': `repeat(${GRID_SIZE}, minmax(45px, 1fr))`,
                'grid-template-rows': `repeat(${gridData.length}, minmax(45px, 1fr))`,
                'gap': '20px' // Add space between rows and columns
            });
    
        gridData.forEach((row, rowIndex) => {
            row.forEach((char, colIndex) => {
                grid.append(
                    $('<div>')
                        .addClass('cell')
                        .data({ row: rowIndex, col: colIndex })
                        .text(char)
                );
            });
        });
    }

    // Event handling
    function setupEventHandlers() {
        $('#grid').on('mousedown touchstart', '.cell', function(e) {
            game.state.dragging = true;
            const $cell = $(this);
            game.state.selected = [{
                row: $cell.data('row'),
                col: $cell.data('col'),
                char: $cell.text()
            }];
            $cell.addClass('selected');
            updateLine();
        });
    
        $(document)
        .on('mousemove touchmove', function(e) {
            if (!game.state.dragging) return;
            
            const $cell = $(document.elementFromPoint(
                e.clientX || e.originalEvent.touches[0].clientX,
                e.clientY || e.originalEvent.touches[0].clientY
            )).closest('.cell');
    
            if ($cell.length) {
                const cellData = {
                    row: $cell.data('row'),
                    col: $cell.data('col'),
                    char: $cell.text()
                };
                
                if (isValidSelection(cellData)) {
                    game.state.selected.push(cellData);
                    $cell.addClass('selected');
                    updateLine();
                }
            }
        })
        .on('mouseup touchend', endSelection);
    }

    // Updated validation logic
    function isValidSelection(newCell) {
        if (game.state.selected.length === 0) return true;
        
        const lastCell = game.state.selected[game.state.selected.length - 1];
        
        // Check adjacency
        const rowDiff = Math.abs(newCell.row - lastCell.row);
        const colDiff = Math.abs(newCell.col - lastCell.col);
        
        // Check if already selected
        const isDuplicate = game.state.selected.some(cell => 
            cell.row === newCell.row && cell.col === newCell.col
        );
        
        return rowDiff <= 1 && colDiff <= 1 && !isDuplicate;
    }

    function endSelection() {   
        game.state.dragging = false;
        const selectedWord = game.state.selected
            .map(c => c.char)
            .join('')
            .toUpperCase();

        if (game.config.words.includes(selectedWord)) {
            highlightWord(selectedWord);
            game.config.foundWords.push(selectedWord);
            game.config.score += selectedWord.length * 100;
            updateScore();
            updateWordList();
        }

        console.log('Selected word:', selectedWord);
        resetSelection();
    }

    function highlightWord(word) {
        const placement = game.config.placements[word];
        if (!placement) return;

        let row = placement.start.row;
        let col = placement.start.col;
        const [ydir, xdir] = placement.direction;

        word.split('').forEach(() => {
            $(`.cell[data-row="${row}"][data-col="${col}"]`).addClass('found');
            row += {S: 1, N: -1}[ydir] || 0;
            col += {O: 1, W: -1}[xdir] || 0;
        });
    }

    function updateScore() {
        $('#score').text(`Score: ${game.config.score}`);
    }

    function updateWordList() {
        $('#wordList').empty();
        game.config.words.forEach(word => {
            $('#wordList').append(
                $('<div>')
                    .addClass('word-item')
                    .toggleClass('found', game.config.foundWords.includes(word))
                    .text(word)
            );
        });
    }

    function resetSelection() {
        $('.cell').removeClass('selected');
        game.state.selected = [];
        $('#lineCanvas').empty();
    }

    function updateLine() {
        const points = game.state.selected.map(cell => {
            // Calculate the center of the cell (adjust values as needed)
            const $cell = $(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
            const offset = $cell.offset();
            return `${offset.left + ($cell.width()/2)},${offset.top + ($cell.height()/2)}`;
        }).join(' ');
        
        $('#lineCanvas').html(`<polyline points="${points}" 
            stroke="#2196F3" fill="none" stroke-width="3"/>`);
    }

    function updateStatus(message, isError = false) {
        $('#status')
            .text(message)
            .css('color', isError ? '#ff4444' : '#4CAF50');
    }

    // Start the game
    init();
});
