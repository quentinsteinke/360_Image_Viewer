const { ipcRenderer } = require('electron');

// Minimize the current window
document.getElementById('minimize-button').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

// Maximize or restore the current window
document.getElementById('maximize-button').addEventListener('click', () => {
    ipcRenderer.send('toggle-maximize-window');
});

// Close the current window
document.getElementById('close-button').addEventListener('click', () => {
    ipcRenderer.send('close-window');
});
