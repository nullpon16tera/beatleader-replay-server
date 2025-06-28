const enableServerBtn = document.getElementById('enable-server-btn');
const statusBox = document.getElementById('status-box');
const statusText = document.getElementById('status-text');

enableServerBtn.addEventListener('click', () => {
    // Disable the button immediately to prevent multiple clicks
    enableServerBtn.disabled = true;
    window.electronAPI.enableServer();
});

window.electronAPI.onStatusUpdate(({ status, message }) => {
    console.log(`Status Update: ${status} - ${message}`);

    statusText.innerText = message;
    
    // Reset class list to only have status-box
    statusBox.className = 'status-box';
    // Add the new status class
    statusBox.classList.add(status);

    // Re-enable button only if there's an error or it's stopped.
    enableServerBtn.disabled = (status === 'running' || status === 'info');
});

window.electronAPI.onReplayPath((path) => {
    document.getElementById('replay-path').innerText = path;
});