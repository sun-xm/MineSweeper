import { remote } from 'electron';
import { Module } from './module';
import { newGame } from './index';
import { Config, Scale } from './config';
import * as Menu from './menu';

export function module(elem: Element) {
    return new Title(elem);
}

export class Title extends Module {
    constructor(elem: Element) {
        super(elem);
    }

    async onload() {
        this.element.querySelector('#close.system')?.addEventListener('click', ()=>remote.getCurrentWindow().close());
        this.element.querySelector('#minimize.system')?.addEventListener('click', ()=>remote.getCurrentWindow().minimize());

        this.game = await Menu.Dropdown.create(<HTMLElement>this.element.querySelector('#game.menu'), { attribute: 'path'});
        this.game.onCommand('new',    ()=>{ newGame(); })
        this.game.onCommand('quick',  ()=>{ Config.inst.quick = this.game?.item('quick')?.isChecked(); })
        this.game.onCommand('small',  ()=>{ Config.inst.scale = this.scale(); newGame(); })
        this.game.onCommand('medium', ()=>{ Config.inst.scale = this.scale(); newGame(); })
        this.game.onCommand('large',  ()=>{ Config.inst.scale = this.scale(); newGame(); })
        this.game.onCommand('exit',   ()=>{ remote.getCurrentWindow().close(); });

        switch (Config.inst.scale) {
            case Scale.Small: {
                this.game.item('small')?.check();
                break;
            }

            case Scale.Medium: {
                this.game.item('medium')?.check();
                break;
            }

            case Scale.Large: {
                this.game.item('large')?.check();
                break;
            }
        }

        if (Config.inst.quick) {
            this.game.item('quick')?.check();
        } else {
            this.game.item('quick')?.uncheck();
        }
    }

    scale() {
        if (this.game?.item('small')?.isChecked()) {
            return Scale.Small;
        } else if (this.game?.item('medium')?.isChecked()) {
            return Scale.Medium;
        } else {
            return Scale.Large;
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