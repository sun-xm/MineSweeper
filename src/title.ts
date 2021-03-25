import { remote } from 'electron';
import { Module } from './module';
import * as Menu from './menu';

export function module(elem: Element) {
    return new Title(elem);
}

export enum Size {
    Small,
    Medium,
    Large
}

export class Title extends Module {
    constructor(elem: Element) {
        super(elem);
    }

    async onload() {
        this.element.querySelector('#close.system')?.addEventListener('click', ()=>remote.getCurrentWindow().close());
        this.element.querySelector('#minimize.system')?.addEventListener('click', ()=>remote.getCurrentWindow().minimize());

        this.game = await Menu.Dropdown.create(<HTMLElement>this.element.querySelector('#game.menu'), { attribute: 'path'});
        this.game.onCommand('exit', ()=>remote.getCurrentWindow().close());
    }

    size() {
        if (this.game?.item('small')?.isChecked()) {
            return Size.Small;
        } else if (this.game?.item('medium')?.isChecked()) {
            return Size.Medium;
        } else {
            return Size.Large;
        }
    }

    minWidth() {
        let capWidth = 0;

        let children = this.element.querySelector('#caption')?.children;
        if (children) {
            for (let i = 0; i <children.length; i++) {
                let c = children[i];

                if (!c.classList.contains('space')) {
                    capWidth += (c as HTMLElement).offsetWidth;
                }
            }
        }

        return (this.element.querySelector('#close.system') as HTMLElement).offsetWidth + 
               (this.element.querySelector('#minimize.system') as HTMLElement).offsetWidth +
               (this.element.querySelector('#game.menu') as HTMLElement).offsetWidth +
               (this.element.querySelector('#icon') as HTMLElement).offsetWidth +
               capWidth;
    }

    game: Menu.Dropdown | undefined;
}