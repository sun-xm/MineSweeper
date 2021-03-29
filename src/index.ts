import { remote } from 'electron'
import { Module } from './module';
import { Title, Size } from './title'
import { Content } from './content'

let title: Title | undefined;
let content: Content | undefined;

async function newGame(size: Size) {
    await content?.newGame(size);

    let w = Math.max(content?.minWidth() ?? 0, title?.minWidth() ?? 0);
    let h = (content?.minHeight() ?? 0) + (title?.element as HTMLElement).offsetHeight;

    remote.getCurrentWindow().setMinimumSize(w, h);
    remote.getCurrentWindow().setSize(w, h);
}

function cellSize(delta: number) {
    if (content) {
        let d = delta / 100;
        let s = Math.max(30, Math.min(40, content.getCellSize() + d));

        let size = document.head.querySelector('.cell-size');
        if (size) {
            size.innerHTML = `#content .cell div{ width: ${s - 4}px; height: ${s - 4}px; font-size: ${ s * 2 / 3 }px; } #content .cell div img { width: ${s - 6}px; height: ${s - 6}px; }`

            let w = Math.max(content?.minWidth() ?? 0, title?.minWidth() ?? 0);
            let h = (content?.minHeight() ?? 0) + (title?.element as HTMLElement).offsetHeight;
        
            remote.getCurrentWindow().setMinimumSize(w, h);
            remote.getCurrentWindow().setSize(w, h);
        }
    }
}

window.addEventListener('load', async ()=>{
    title = await Module.load<Title>(document.getElementById('title')!);
    await title?.onload();

    content = await Module.load<Content>(document.getElementById('content')!);
    if (content) {
        await content.load();
        newGame(title?.size()!);

        title?.game?.onCommand('new',    ()=>newGame(title?.size()!));
        title?.game?.onCommand('small',  ()=>newGame(title?.size()!));
        title?.game?.onCommand('medium', ()=>newGame(title?.size()!));
        title?.game?.onCommand('large',  ()=>newGame(title?.size()!));

        let q = title?.game?.item('quick');
        if (q) {
            content.quick = q.isChecked.bind(q);
        }
    }

    document.addEventListener('wheel', (e)=>{ cellSize((e as WheelEvent).deltaY); });
});