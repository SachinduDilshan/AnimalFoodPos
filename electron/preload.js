const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printInvoice: (invoiceNo) => ipcRenderer.invoke('print-invoice', invoiceNo),
});