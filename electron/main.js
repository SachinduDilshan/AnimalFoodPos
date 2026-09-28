const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { startServer } = require('../backend/src/server');

app.commandLine.appendSwitch('lang', 'en-US');

let mainWindow;

async function createWindow() {
  const dbPath = path.join(app.getPath('userData'), 'pos.db');
  await startServer({ dbPath });

  mainWindow = new BrowserWindow({
    show: false,
    icon: path.join(__dirname, 'build/icon.ico'),
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

  const pdfBuffer = await mainWindow.webContents.printToPDF({
    pageSize: { width: 9.5, height: 11 },
    printBackground: true,
    margins: { top: 0.3, bottom: 0.3, left: 0.4, right: 0.4 },
    scale: 0.85,
  });
  fs.writeFileSync(filePath, pdfBuffer);

  return { success: true, filePath };
});

// Plain-text print straight to the Windows default printer (used for the dot matrix printer)
ipcMain.handle('print-raw-text', async (event, { printerName, text }) => {
  return new Promise((resolve) => {
    const tempFile = path.join(os.tmpdir(), `invoice-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, text, 'utf8');

    const printerArg = printerName ? `-Name '${printerName.replace(/'/g, "''")}'` : '';
    const command = `powershell -NoProfile -Command "Get-Content -Path '${tempFile}' -Encoding UTF8 | Out-Printer ${printerArg}"`;

    exec(command, (error) => {
      fs.unlink(tempFile, () => { });
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
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