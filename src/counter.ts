import { Module } from './module';

export class Counter extends Module {
    constructor(e: Element) {
        super(e);
    }

    left(n: number) {
        let d = Counter.toDigits(n);

        let html = '';
        for (let i = 0; i < d.length; i++) {
            html += `<img src="img/${d[i]}.svg" />`;
        }

        (<HTMLElement>this.element.querySelector('#left')).innerHTML = html;
    }

    start() {
        this.begin = (new Date()).getTime();
        this.elapsed = 0;

        this.timer = setInterval(()=>{
            let e = Math.floor(((new Date()).getTime() - this.begin) / 1000);

            if (this.elapsed != e) {
                this.elapsed = e;

                let d = Counter.toDigits(this.elapsed);

                let html = '';
                for (let i = 0; i < d.length; i++) {
                    html += `<img src="img/${d[i]}.svg" />`;
                }

                (<HTMLElement>this.element.querySelector('#time')).innerHTML = html;
            }
        }, 100);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    reset() {
        this.stop();
        
        let html = '<img src="img/0.svg"/><img src="img/0.svg"/><img src="img/0.svg"/>';
        (<HTMLElement>this.element.querySelector('#time')).innerHTML = html;
        (<HTMLElement>this.element.querySelector('#left')).innerHTML = html;
    }

    minWidth() {
        let w = 0;

        for (let i = 0; i < this.element.children.length; i++) {
            let c = this.element.children[i];

            if (!c.classList.contains('space')) {
                w += (c as HTMLElement).offsetWidth;
            }
        }

        return w;
    }

    minHeight() {
        return (this.element as HTMLElement).offsetHeight;
    }

    private static toDigits(n: number) {
        n = Math.max(0, Math.min(999, n));

        let d2 = Math.floor(n / 100);
        n = n - d2 * 100;

        let d1 = Math.floor(n / 10);
        n = n - d1 * 10;

        return [ d2, d1, n ];
    }

    private timer: NodeJS.Timeout | undefined = undefined;
    private begin = 0;
    private elapsed = 0;
}

export function module(e: Element) {
    return new Counter(e);
}