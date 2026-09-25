const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('../backend/src/server');

let mainWindow;

async function createWindow() {
  const dbPath = path.join(app.getPath('userData'), 'pos.db');
  await startServer({ dbPath });

  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.maximize();
  mainWindow.show();

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

ipcMain.handle('print-invoice', async (event, invoiceNo) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Invoice',
    defaultPath: `${invoiceNo || 'Invoice'}.pdf`,
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) return { success: false };

  const pdfBuffer = await mainWindow.webContents.printToPDF({});
  fs.writeFileSync(filePath, pdfBuffer);

  return { success: true, filePath };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});