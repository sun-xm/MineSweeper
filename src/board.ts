import { Counter } from './counter';
import { Module } from './module';

enum State {
    None,
    Flagged,
    Questioned
}

class Cell {
    constructor(row: number, col: number, board: Board) {
        this.row = row;
        this.col = col;
        this.board = board;
        this.element.setAttribute('row', row.toString());
        this.element.setAttribute('col', col.toString());
    }

    flip() {
        if (State.None != this.state) {
            return 0;
        }

        if (this.isMine) {
            this.element.classList.add('flipped');
            this.inner().innerHTML = '<img src="img/boom.svg"/>'
            this.flipped = true;
            this.board.boom();
            return 1;
        }

        let count = 0;

        if (!this.flipped) {
            this.element.classList.add('flipped');
            this.inner().innerText = (0 == this.surroundings ? '' : this.surroundings.toString());
            this.flipped = true;
            count++;
        }

        if (0 == this.surroundings) {
            this.board.forEachSurround(this, (c)=>{
                if (!c.flipped && State.None == c.state) {
                    count += c.flip();
                }});
        } else {
            let flagged = 0;
            this.board.forEachSurround(this, (c)=>{ flagged += (State.Flagged == c.state) ? 1 : 0; });

            if (flagged == this.surroundings) {
                this.board.forEachSurround(this, (c)=>{
                    if (!c.flipped && State.None == c.state) {
                        count += c.flip();
                    }
                });
            }
        }

        return count;
    }

    flag() {
        if (this.flipped) {
            return 0;
        }
        
        switch (this.state) {
            case State.None: {
                this.inner().innerHTML = '<img src="img/flag.svg" />'
                this.state = State.Flagged;
                return 1;
            }

            case State.Flagged: {
                this.inner().innerText = '?';
                this.state = State.Questioned;
                return -1;
            }

            case State.Questioned: {
                this.inner().innerHTML = '';
                this.state = State.None;
                return 0;
            }
        }
    }

    inner() {
        return <HTMLElement>this.element.children[0]!;
    }

    width() {
        return this.element.offsetWidth;
    }

    height() {
        return this.element.offsetHeight;
    }

    row: number;
    col: number;
    board: Board;
    
    element= <HTMLElement>Cell.template.cloneNode(true);
    isMine  = false;
    flipped = false;
    trying  = false;
    state   = State.None;
    surroundings = 0;

    private static template: HTMLElement;

    private static init = (()=>{
        Cell.template = document.createElement('div');
        Cell.template.classList.add('cell');
        Cell.template.appendChild(document.createElement('div'));
    })();
}

class Line {
    append(cell: Cell) {
        this.element.append(cell.element);
        this.cells.push(cell);
    }

    element = <HTMLElement>Line.template.cloneNode(true);

    cells: Cell[] = [];

    private static template: HTMLElement;

    private static init = (()=>{
        Line.template = document.createElement('div');
        Line.template.classList.add('line');
    })();
}

export class Board extends Module {
    constructor(e: Element) {
        super(e);
        e.addEventListener('module_unload', this.unload.bind(this));
    }

    load(rows: number, cols: number, mines: number, counter: Counter, quick: ()=>boolean) {
        this.rows  = rows;
        this.cols  = cols;
        this.mines = mines;
        this.quick = quick;
        this.counter = counter;

        for (let i = 0; i < rows; i++) {
            let l = new Line();
            this.lines.push(l);

            for (let j = 0; j < cols; j++) {
                let c = new Cell(i, j, this);
                l.append(c);

                c.element.addEventListener('click', this.onClickCell.bind(this));
                c.element.addEventListener('contextmenu', this.onRClickCell.bind(this));
            }
            
            this.element.append(l.element);
        }

        this.counter?.reset();
    }

    cell(row: number, col: number) {
        return this.lines[row].cells[col];
    }

    boom() {
        this.terminated = true;

        this.counter?.stop();

        this.forEachCell((c)=>{
            if (State.Flagged == c.state) {
                if (!c.isMine) {
                    c.inner().innerHTML = '<img src="img/wrong.svg" />';
                }
            } else if (c.isMine && !c.flipped) {
                c.inner().innerHTML = '<img src="img/mine.svg"/>';
            }
        });
    }

    survive() {
        this.terminated = true;

        this.counter?.stop()
        this.counter?.left(0);

        this.forEachCell((c=>{
            if (c.isMine) {
                if (State.Flagged != c.state) {
                    this.flagged += c.flag();
                }
            } else if (!c.flipped) {
                this.flipped += c.flip();
            }
        }));
    }

    forEachCell(callback: (c: Cell)=>void) {
        for (let l of this.lines) {
            for (let c of l.cells) {
                callback(c);
            }
        }
    }

    forEachSurround(cell: Cell, callback: (c: Cell)=>void) {
        for (let r = cell.row - 1; r <= cell.row + 1; r++) {
            if (r < 0 || r == this.rows) {
                continue;
            }

            for (let c = cell.col - 1; c <= cell.col + 1; c++) {
                if (c < 0 || c == this.cols) {
                    continue;
                }

                if (cell.row == r && cell.col == c) {
                    continue;
                }

                callback(this.cell(r, c));
            }
        }
    }

    minWidth() {
        return this.lines.length > 0 ? (this.lines[0].cells[0].width() * this.lines[0].cells.length) : 0;
    }

    minHeight() {
        return this.lines.length > 0 ? this.lines[0].cells[0].height() * this.lines.length : 0;
    }

    getCellSize() {
        return this.lines.length > 0 ? this.lines[0].cells[0].width() : 0;
    }

    private unload() {
        this.element.removeEventListener('module_unload', this.unload);
        this.element.innerHTML = '';
    }

    private generate(row: number, col: number) {
        let rate = this.mines / (this.rows * this.cols) * 0.2;
        let count = 0;
        while (count < this.mines) {
            for (let i = 0; i < this.rows && count < this.mines; i++) {
                let l = this.lines[i];

                for (let j = 0; j < this.cols && count < this.mines; j++) {
                    // exclude the cell and cells surrounding it
                    if (Math.abs(i - row) < 2 && Math.abs(j - col) < 2) {
                        continue;
                    }

                    let c = l.cells[j];
                    if (!c.isMine && Math.random() < rate) {
                        c.isMine = true;
                        c.element.classList.add('mine');
                        count++;
                    }
                }
            }
        }

        // count surrounding mines for each cell
        this.forEachCell((cell)=>{
            cell.surroundings = 0;
            this.forEachSurround(cell, (c)=>{ cell.surroundings += c.isMine ? 1 : 0; });
        });

        this.counter?.start();
        this.counter?.left(this.mines);
    }

    private onClickCell(e: Event) {
        if (this.terminated) {
            return;
        }

        let elem = <HTMLElement>e.target;

        while (!elem.classList.contains('cell')) {
            elem = elem.parentElement!;
        }

        let row = parseInt(elem.getAttribute('row')!);
        let col = parseInt(elem.getAttribute('col')!);

        if (0 == this.flipped) {
            this.generate(row, col);
        }

        this.flipped += this.cell(row, col).flip();

        if (!this.terminated && 0 == this.rows * this.cols - this.flipped - this.mines) {
            this.survive();
        }
    }

    private onRClickCell(e: Event) {
        if (this.terminated) {
            return;
        }

        if (0 == this.flipped) {
            return;
        }

        let elem = <HTMLElement>e.target;

        while (!elem.classList.contains('cell')) {
            elem = elem.parentElement!;
        }

        let row = parseInt(elem.getAttribute('row')!);
        let col = parseInt(elem.getAttribute('col')!);

        let cell = this.cell(row, col);
        this.flagged += cell.flag();

        if (this.quick?.()) {
            this.forEachSurround(cell, (c)=>{
                if (c.flipped) {
                    this.flipped += c.flip();
                }
            });

            if (0 == this.rows * this.cols - this.flipped - this.mines) {
                this.survive();
            }
        }

        this.counter?.left(this.mines - this.flagged);
    }

    rows = 0;
    cols = 0;
    lines: Line[] = [];

    mines = 0;
    flipped = 0;
    flagged = 0;

    terminated = false;

    quick: (()=>boolean) | undefined;
    counter: Counter | undefined;
}

export function module(e: Element) {
    return new Board(e);
}