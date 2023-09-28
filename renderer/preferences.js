const { remote } = require('electron');
const fs = require('fs');

// Get a reference to the dynamic window div
const dynamicWindow = document.querySelector('.dynamic-window');

// Add a click event listener to the navigation links
document.querySelectorAll('.nav a').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default link behavior

        const section = event.target.getAttribute('data-section'); // Get the data-section attribute

        if (section) {
            // Load the HTML content for the selected section
            const htmlPath = `${__dirname}/${section}.html`; // Assuming HTML files are in the same directory as preferences.js

            // Read the HTML file and set its content to the dynamic window
            fs.readFile(htmlPath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file: ${err}`);
                } else {
                    dynamicWindow.innerHTML = data;
                }
            });
        }
    });
});

// const toggleCarouselCheckbox = document.getElementById('toggle-carousel');

// toggleCarouselCheckbox.addEventListener('change', (event) => {
//     const isEnabled = event.target.checked;
//     ipcRenderer.send('toggle-carousel', isEnabled);
// });

// // When the preferences page loads, initialize the checkbox state
// ipcRenderer.on('init-carousel-state', (event, isEnabled) => {
//     toggleCarouselCheckbox.checked = isEnabled;
// });
