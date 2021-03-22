export async function include(elem: Element, path?: string): Promise<Element> {
    if (!path) {
        path = elem.getAttribute('include') ?? undefined;
    }

    if (!path) {
        throw 'Neither path is defined or element has a valid replace attribute';
    }

    elem.innerHTML = await (await fetch(path)).text();

    let all: Promise<Element>[] = [];
    for (let i = 0; i < elem.children.length; i++) {
        all.push(process(elem.children[i]));
    }

    await Promise.all(all);

    return elem;
}

export async function replace(elem: Element, path?: string): Promise<Element> {
    if (!path) {
        path = elem.getAttribute('replace') ?? undefined;
    }

    if (!path) {
        throw 'Neither path is defined or element has a valid replace attribute';
    }

    let div = document.createElement('div');
    div.innerHTML = await (await fetch(path)).text();

    let rep = await process(div.children[0]);
    elem.replaceWith(rep);

    return rep;
}

export async function process(elem: Element): Promise<Element> {
    let inc = elem.getAttribute('include');
    if (inc) {
        return include(elem, inc);
    }

    let rep = elem.getAttribute('replace');
    if (rep) {
        return replace(elem, rep);
    }

    let all: Promise<Element>[] = [];

    for (let i = 0; i < elem.children.length; i++) {
        all.push(process(elem.children[i]));
    }

    await Promise.all(all);

    return elem;
}