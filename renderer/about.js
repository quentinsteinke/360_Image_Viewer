const { app } = require('electron');

const appVersionElement = document.getElementById('app-version');
appVersionElement.textContent = `Version: ${app.getVersion()}`;