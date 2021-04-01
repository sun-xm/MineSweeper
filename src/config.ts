import * as fs from 'fs'

export class Config {
    static async load() {
        try {
            Config.inst = await (await fetch('config.json')).json();
        } catch (e) {
            console.debug(e);
        }

        if (!Config.inst) {
            Config.inst = new Object();
            Config.inst.scale = Scale.Medium;
            Config.inst.quick = false;
            Config.inst.cellSize = 30;
        }
    }

    static save() {
        fs.writeFileSync('config.json', JSON.stringify(Config.inst));
    }

    static inst: any | undefined;
}

export enum Scale {
    Small,
    Medium,
    Large
}