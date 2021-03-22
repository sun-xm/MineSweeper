import { Module } from './module';
import { Title } from './title'
import { Content } from './content'

let title: Title | undefined;
let content: Content | undefined;

window.addEventListener('load', async ()=>{
    title = await Module.load<Title>(document.getElementById('title')!);
    await title?.onload();

    const content = await Module.load<Content>(document.getElementById('content')!);
    if (content) {
        await content.load();
        content.newGame(title?.size()!);

        title?.game?.onCommand('new',    async ()=>content.newGame(title?.size()!));
        title?.game?.onCommand('small',  async ()=>content.newGame(title?.size()!));
        title?.game?.onCommand('medium', async ()=>content.newGame(title?.size()!));
        title?.game?.onCommand('large',  async ()=>content.newGame(title?.size()!));

        let q = title?.game?.item('quick');
        if (q) {
            content.quick = q.isChecked.bind(q);
        }
    }
});