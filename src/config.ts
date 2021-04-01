import * as fs from 'fs'

export class Config {
    static load() {
        try {
            let json = fs.readFileSync('config.json', { encoding: 'utf8' });
            Config.inst = JSON.parse(json);
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