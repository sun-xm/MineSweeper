import { remote } from 'electron'
import { Module } from './module';
import { Title, Size } from './title'
import { Content } from './content'

let title: Title | undefined;
let content: Content | undefined;

async function newGame(size: Size) {
    await content?.newGame(size);

    let w = (content?.minWidth() ?? 0);
    let h = (content?.minHeight() ?? 0) + (title?.element as HTMLElement).offsetHeight;
    let s = remote.getCurrentWindow().getSize();
    
    s[0] = Math.max(s[0], w);
    s[1] = Math.max(s[1], h);

    remote.getCurrentWindow().setMinimumSize(w, h);
    remote.getCurrentWindow().setSize(s[0], s[1]);
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
});