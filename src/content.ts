import { Counter } from './counter';
import { Module } from './module';
import { Board } from './board';
import { Size } from './title'

export class Content extends Module {
    constructor(e: Element) {
        super(e);
    }

    async load() {
        this.counter = await Module.load<Counter>(this.element.querySelector('#counter')!);
    }
    
    async newGame(size: Size) {
        let rows: number;
        let cols: number;
        let mines: number;

        switch (size) {
            case Size.Small: {
                rows  = 10;
                cols  = 10;
                mines = 20;
                break;
            }

            case Size.Medium: {
                rows  = 16;
                cols  = 16;
                mines = 40;
                break;
            }

            case Size.Large: {
                rows  = 20;
                cols  = 20;
                mines = 80;
                break;
            }
        }

        this.board = await Module.load<Board>(this.element.querySelector('#board')!);
        this.board?.load(rows, cols, mines, this.counter!, this.quick!);
    }

    minWidth () {
        return Math.max(this.counter?.minWidth() ?? 0, (this.board?.minWidth() ?? 0) + 60);
    }

    minHeight() {
        return (this.counter?.minHeight() ?? 0) + (this.board?.minHeight() ?? 0) + 60;
    }

    getCellSize() {
        return this.board?.getCellSize() ?? 0;
    }
    
    quick: (()=>boolean) | undefined;
    counter: Counter | undefined;
    board: Board | undefined;
}

export function module(e: Element) {
    return new Content(e);
}