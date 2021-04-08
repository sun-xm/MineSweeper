export class Module {
    static async create<M extends Module>(html: { html?: string, path?: string }, module?: string) {
        if (!html.html) {
            try {
                html.html = html.path ? await (await fetch(html.path)).text() : undefined;
            } catch (e) {
                console.debug('Module.create(): failed to fetch ' + html.path + '. ' + e);
                return undefined;
            }
        }

        if (!html.html) {
            console.debug('Module.create(): undefined html content');
            return undefined;
        }

        let div = document.createElement('div');
        div.innerHTML = html.html;

        if (0 == div.children.length) {
            console.debug('Module.create(): failed to create element. Html:\n' + html.html);
            return undefined;
        }

        module = module ? module : div.children[0].getAttribute('module') ?? undefined;
        if (!module) {
            console.debug('Module.create(): undefined module name');
            return undefined;
        }

        return <M>(await require(module).module(div.children[0]));
    }

    static async load<M extends Module>(elem: Element, html?: { html?: string, path?: string }, module?: string) {
        if (html) {
            if (!html.html) {
                try {
                    html.html = html.path ? await (await fetch(html.path)).text() : undefined;
                } catch (e) {
                    console.debug('Module.load(): failed to fetch ' + html.path + '. ' + e);
                    return undefined;
                }
            }
        } else {
            html = { html: undefined, path: elem.getAttribute('include') ?? undefined };
            
            try {
                html.html = html.path ? await (await fetch(html.path)).text() : undefined;
            } catch (e) {
                console.debug('Module.load(): failed to fetch include property ' + html.path + '. ' + e);
                return undefined;
            }
        }

        module = module ? module : elem.getAttribute('module') ?? undefined;
        if (!module) {
            console.debug('Module.load(): undefined module name');
            return undefined;
        }

        elem.dispatchEvent(new Event('module_unload'));

        if (null != html.html) {
            elem.innerHTML = html.html;
        }

        return <M>(await require(module).module(elem));
    }

    constructor (e: Element) {
        this.element = e;
    }

    element: Element;
}