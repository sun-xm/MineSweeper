import { app, BrowserWindow, ipcMain } from 'electron';

function createWindow() {
    let win = new BrowserWindow({ resizable: false, maximizable: false, frame: false, show: false, webPreferences: { nodeIntegration: true, enableRemoteModule: true }});
    ipcMain.once('ready-to-show', ()=>win.show());
    win.setMenu(null);
    win.loadFile('html/index.html');
    // win.webContents.openDevTools({ mode: 'detach' });
}

app.on('ready', ()=>{
    createWindow();

    app.on('activate', ()=>{
        if (0 == BrowserWindow.getAllWindows().length) {
            createWindow();
        }
    });
});

app.on('window-all-closed', ()=>{
    if ('darwin' != process.platform) {
        app.quit();
    }
});