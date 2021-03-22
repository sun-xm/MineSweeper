const Group = 'group';
const Check = 'check';
const Radio = 'radio';
const Checked = 'checked';
const Disabled = 'disabled';

function px(n : Number)
{
    return `${n}px`;
}

abstract class Menu {
    public abstract destroy(): void;

    public static hide() {
        Menu.curr?.hideMenu();
        Menu.curr = null;
    }

    public container() {
        return this.cont;
    }

    public item(id: string) {
        return this.items.get(id);
    }

    public onCommand(id: string, handler: (i: Item, e: Event)=>void) {
        let item = this.items.get(id);
        if (!item) {
            console.debug('Menu.onCommand(): item not found');
            return;
        }

        item.handler = handler;
    }

    public addItem(id: string, item: { html?: string, element?: HTMLElement }, insertBefore?: Node) {
        if (!id) {
            console.debug('Menu.addItem: invalid item id');
            return;
        }

        if (this.items.has(id)) {
            console.debug('Menu.addItem: duplicated item id ' + id);
            return;
        }

        let elem: HTMLElement;

        if (null != item.html) {
            elem = Menu.createElement(item.html);
        } else if (null != item.element) {
            elem = item.element;
        } else {
            throw 'html and element can not be both absent';
        }

        elem.id = id;
        elem.classList.add('item');

        if (elem.classList.contains('menu')) {
            elem.classList.remove('menu');
        }

        elem.addEventListener('click', this.onClickItem.bind(this));
        elem.addEventListener('mouseenter', this.onEnterItem.bind(this));

        if (null == insertBefore) {
            this.cont.appendChild(elem);
        } else {
            this.cont.insertBefore(elem, insertBefore);
        }

        let i = new Item(id, elem, this);
        this.items.set(id, i);
    }

    public addSubmenu(id: string, item: { html?: string, element?: HTMLElement }, menu: Popup, insertBefore?: Node) {
        if (!id) {
            console.debug('Menu.addSubmenu(): invalid menu id');
            return;
        }

        if (this.items.has(id)) {
            console.debug('Menu.addSubmenu(): duplicated menu id ' + id);
            return;
        }

        let elem: HTMLElement;

        if (null != item.html) {
            elem = Menu.createElement(item.html);
        } else if (null != item.element) {
            elem = item.element;
        } else {
            throw 'html and element can not be both absent';
        }

        elem.id = id;
        elem.classList.add('menu');

        if (elem.classList.contains('item')) {
            elem.classList.remove('item');
        }

        elem.addEventListener('mouseenter', this.onEnterMenu.bind(this));

        if (null == insertBefore) {
            this.cont.appendChild(elem);
        } else {
            this.cont.insertBefore(elem, insertBefore);
        }

        let i = new Item(elem.id, elem, this);
        i.submenu = menu;
        this.items.set(id, i);
    }

    public remove(id: string) {
        let item = this.items.get(id);
        if (item) {
            item.element.remove();
            this.items.delete(id);
        }
    }

    public addSeparator(item: { html?: string, element?: HTMLElement }, insertBefore?: Node) {
        let elem: HTMLElement;

        if (null != item.html) {
            elem = Menu.createElement(item.html);
        } else if (null != item.element) {
            elem = item.element;
        } else {
            throw 'html and element can not be both absent';
        }

        elem.classList.add('separator');

        if (null == insertBefore) {
            this.cont.appendChild(elem);
        } else {
            this.cont.insertBefore(elem, insertBefore);
        }
    }

    public removeSeparator(id: string) {
        for (let i = 0; i < this.cont.children.length; i++) {
            let c = this.cont.children[i];
            if (id === c.id) {
                c.remove();
                break;
            }
        }
    }

    public uncheckGroup(group: string) {
        this.items.forEach((item)=>{
            if (item.isRadio() && group === item.group()) {
                item.uncheck();
            }
        });
    }

    protected showMenu() {
        this.cont.style.display = 'block';
    }

    protected hideMenu() {
        if (null != this.root) {
            this.root.hideMenu();
        } else {
            if (null != this.subm) {
                this.subm.hideMenu();
            }

            this.cont.style.display = 'none';
        }
    }

    protected constructor() {
        this.root = null;
        this.subm = null;
        this.sour = null;
        this.items = new Map<string, Item>();
        
        this.cont = document.createElement('div');
        this.cont.style.display  = 'none';
        this.cont.style.position = 'absolute';
        this.cont.addEventListener('click', Menu.onClickContainer);
    }

    protected async load(content: { html?: string, path?: string, element?: HTMLElement, attribute?: string }) {
        let html: string;

        if (null != content.html) {
            html = content.html;
        } else if (null != content.path) {
            html = await (await fetch(content.path)).text();
        } else if (null != content.element && null != content.attribute) {
            html = await (await fetch(content.element.getAttribute(content.attribute) ?? '')).text();
        }
        else {
            throw 'Either html or path or element and attribute must be provided';
        }

        this.cont.innerHTML = html;

        let items = this.cont.getElementsByClassName('item');
        for (let i = 0; i < items.length; i++) {
            let item = items[i];

            if (!item.id) {
                console.debug('Menu.load(): item id is missing');
                continue;
            }

            if (this.items.has(item.id)) {
                console.debug('Menu.load(): duplicated item ' + item.id);
                continue;
            }

            if (!(item instanceof HTMLElement)) {
                console.debug('Menu.load(): item ' + item.id + ' is not HTMLElement');
                continue;
            }

            if (item.classList.contains('menu')) {
                console.debug('Menu.load(): conflict item type - ' + item.id);
            }

            item?.addEventListener('click', this.onClickItem.bind(this));
            item?.addEventListener('mouseenter', this.onEnterItem.bind(this));
            this.items.set(item.id, new Item(item.id, item, this));
        }

        let menus = this.cont.getElementsByClassName('menu');
        for (let i = 0; i < menus.length; i++) {
            let item = menus[i];

            if (!item.id) {
                console.debug('Menu.load(): item id is missing');
                continue;
            }

            if (this.items.has(item.id)) {
                console.debug('Menu.load(): duplicated item ' + item.id);
                continue;
            }

            if (!(item instanceof HTMLElement)) {
                console.debug('Menu.load(): item ' + item.id + ' is not HTMLElement');
                continue;
            }

            if (!item.getAttribute('path')) {
                console.debug('Menu.load(): missing path attribute - ' + item.id);
                continue;
            }

            let mitem = new Item(item.id, item, this);
            mitem.submenu = await Popup.create({ element: item, attribute: 'path' });

            item.addEventListener('mouseenter', this.onEnterMenu.bind(this));
            this.items.set(mitem.id, mitem);
        }
    }

    protected onClickItem(e: Event) {
        let he = <HTMLElement>e.target;
        while (!he.classList.contains('item')) {
            he = he.parentElement!;
        }

        let item = this.items.get(he.id);
        if (item) {
            if (!item.isEnabled()) {
                return;
            }

            if (item.isCheckable()) {
                item.isChecked() ? item.uncheck() : item.check();
                item.handler?.(item, e);

            } else if (item.isRadio()) {
                if (!item.isChecked()) {
                    item.check();
                    item.handler?.(item, e);
                };
            } else {
                item.handler?.(item, e);
            }
        }

        Menu.hide();
    }

    protected onEnterItem(e: Event) {
        if (null != this.subm) {
            this.subm.hideMenu();
            this.subm = null;
        }
    }

    protected onEnterMenu(e: Event) {
        let id = (<HTMLElement>e.target).id;
        let item = this.items.get(id);

        if (this.subm != null && this.subm != item?.submenu) {
            this.subm.hideMenu();
            this.subm = null;
        }

        if (item?.isEnabled() && null != item.submenu && null == this.subm) {
            item.submenu.sour = <HTMLElement>e.target;
            this.subm = item.submenu;
            this.subm.showMenu();
        }
    }

    protected static onClickContainer(e: Event) {
        e.stopPropagation();
    }

    protected static createElement(html: string) {
        let temp = document.createElement('div');
        temp.innerHTML = html;

        if (null == <HTMLElement>temp.firstChild) {
            throw "Failed to create element from html: " + html;
        }

        return <HTMLElement>temp.firstChild;
    }

    protected root: Menu | null;
    protected subm: Menu | null;
    protected cont: HTMLElement;
    protected sour: HTMLElement | null;
    protected items : Map<string, Item>;

    protected static curr: Menu | null = null;
    protected static init = (()=>window.addEventListener('click', ()=>Menu.hide()))();
}

export class Dropdown extends Menu {
    public static async create(source: HTMLElement, content: { html?: string, path?: string, element?: HTMLElement, attribute?: string }): Promise<Dropdown> {
        let m = new Dropdown();
        await m.load({ html: content.html, path: content.path, element: content.element ?? source, attribute: content.attribute });

        m.sour = source;
        m.cont.classList.add('dropdown-menu');
        document.body.appendChild(m.cont);

        source.addEventListener('click', m.onClickSource.bind(m));
        source.addEventListener('mouseenter', m.onEnterSource.bind(m));

        return m;
    }

    public destroy() {
        this.sour?.removeEventListener('click', this.onClickSource);
        this.sour?.removeEventListener('mouseenter', this.onEnterSource);
        document.body.removeChild(this.cont);
    }

    protected showMenu() {
        this.sour!.classList.add('active');
        
        let r = this.sour!.getBoundingClientRect();
        this.cont.style.top  = px(r.top + r.height);
        this.cont.style.left = px(r.left);
        super.showMenu();
    }

    protected hideMenu() {
        this.sour!.classList.remove('active');
        super.hideMenu();
    }

    protected onClickSource(e: Event) {
        e.stopPropagation();

        if (this == Menu.curr) {
            this.hideMenu();
            Menu.curr = null;
        } else {
            Menu.curr = this;
            this.showMenu();
        }
    }

    protected onEnterSource() {
        if (null != Menu.curr) {
            Menu.hide();
            Menu.curr = this;
            this.showMenu();
        }
    }
}

export class Popup extends Menu {
    public static async create(content: { html?: string, path?: string, element?: HTMLElement, attribute?: string }) : Promise<Popup> {
        let m = new Popup();
        await m.load(content);
        
        m.cont.classList.add('popup-menu');
        document.body.appendChild(m.cont);

        return m;
    }

    public destroy() {
        document.body.removeChild(this.cont);
    }

    public show(x: number, y: number, boundry: HTMLElement, zIndex?: number) {
        Menu.hide();

        Menu.curr = this;
        super.showMenu();

        let r = this.cont.getBoundingClientRect();
        let b = boundry.getBoundingClientRect();

        if (x + r.width > b.x + b.width) {
            x = b.x + b.width - r.width;
        }
        if (y + r.height > b.y + b.height) {
            y = b.y + b.height - r.height;
        }

        this.cont.style.left = px(x);
        this.cont.style.top  = px(y);
        this.cont.style.zIndex = null != zIndex ? zIndex.toString() : '';
    }

    protected showMenu() {
        if (null == this.sour) {
            return;
        }
        let r = this.sour.getBoundingClientRect();
        this.cont.style.top  = px(r.top);
        this.cont.style.left = px(r.left + r.width);
        this.cont.style.zIndex = (+this.sour.style.zIndex + 1).toString();
        super.showMenu();
    }

    protected hideMenu() {
        this.sour?.classList.remove('active');
        super.hideMenu();
    }
}

export class Item {
    constructor(id: string, element: HTMLElement, menu: Menu) {
        this.id = id;
        this.menu = menu;
        this.element = element;
    }

    isEnabled() {
        return !this.element.classList.contains(Disabled);
    }

    enable() {
        this.element.classList.remove(Disabled);
    }

    disable() {
        this.element.classList.add(Disabled);
    }

    isCheckable() {
        return this.element.classList.contains(Check);
    }

    isRadio() {
        return this.element.classList.contains(Radio);
    }

    isChecked() {
        if (!this.isCheckable() && !this.isRadio()) {
            return false;
        }

        return this.element.classList.contains(Checked);
    }

    check() {
        if (this.isCheckable()) {
            if (!this.isChecked()) {
                this.element.classList.add(Checked);
            }
        } else if (this.isRadio()) {
            if (!this.isChecked()) {
                if (this.group()) {
                    this.menu.uncheckGroup(this.group()!);
                }
                this.element.classList.add(Checked);
            }
        }
    }

    uncheck() {
        this.element.classList.remove(Checked);
    }

    group() {
        return this.element.getAttribute(Group);
    }

    id : string;
    menu: Menu;
    element: HTMLElement;
    handler: undefined | ((i: Item, e: Event)=>void);
    submenu: undefined | Popup;
}