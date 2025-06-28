const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const express = require('express');
const cors = require('cors');
const selfsigned = require('selfsigned');
const fs = require('fs');
const sudo = require('sudo-prompt');

const PORT = 44313;

let win;
let httpsServer;

// Use a dedicated directory within userData for certificates
const certsDir = path.join(app.getPath('userData'), 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}
const certPath = path.join(certsDir, 'server.crt');
const keyPath = path.join(certsDir, 'server.key');

function sendStatus(status, message) {
    if (win) {
        win.webContents.send('status-update', { status, message });
    }
}

function generateCerts() {
  console.log('Generating new certificates...');
  const pems = selfsigned.generate(
    [{ name: 'commonName', value: 'localhost' }],
    {
      keySize: 2048,
      algorithm: 'sha256',
      days: 3650,
      extensions: [{ name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }] }]
    }
  );
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);
  console.log('Certificates generated.');
  return { cert: pems.cert, key: pems.private };
}

function startServer() {
    const pems = {
        cert: fs.readFileSync(certPath),
        private: fs.readFileSync(keyPath)
    };
    
    const expressApp = express();
    const corsOptions = { origin: 'https://replay.beatleader.com', optionsSuccessStatus: 200 };
    expressApp.use(cors(corsOptions));
    
    const isPackaged = app.isPackaged;
    // Use PORTABLE_EXECUTABLE_DIR if available (for portable builds), otherwise fall back.
    const basePath = process.env.PORTABLE_EXECUTABLE_DIR || (isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath());
    const replayFolder = path.join(basePath, 'UserData', 'BeatLeader', 'Replays');

    if (win) {
        win.webContents.send('replay-path', replayFolder);
    }

    // This check is for logging purposes at startup
    if (!fs.existsSync(replayFolder)) {
        console.error(`Replay folder not found at startup. Path: ${replayFolder}`);
    }
    
    expressApp.get('/backup/file/replays/:filename', (req, res) => {
        // Check for the folder on every request, in case the path was wrong initially
        if (!fs.existsSync(replayFolder)) {
            const errorMessage = `Replay folder not found. Please ensure the app is in the correct Beat Saber directory. Searched path: ${replayFolder}`;
            console.error(errorMessage);
            return res.status(500).send(errorMessage);
        }

        const { filename: urlFilename } = req.params;
        if (urlFilename.includes('..')) {
            return res.status(400).send('Invalid filename.');
        }

        console.log(`Received request for URL filename: ${urlFilename}`);

        const urlParts = urlFilename.replace(/\.bsor$/, '').split('-');
        if (urlParts.length < 5) {
            console.error(`Unexpected URL filename format: ${urlFilename}`);
            return res.status(400).send('Invalid request format.');
        }
        const urlUserId = urlParts[1];
        const urlSongHash = urlParts[4];

        console.log(`Searching for file with UserId: ${urlUserId} and SongHash: ${urlSongHash}`);

        try {
            const files = fs.readdirSync(replayFolder);
            const foundFile = files.find(localFile => 
                localFile.includes(urlUserId) && localFile.includes(urlSongHash)
            );

            if (foundFile) {
                const filePath = path.join(replayFolder, foundFile);
                console.log(`Match found! Serving local file: ${foundFile}`);
                res.download(filePath, (err) => {
                    if (err) {
                        console.error(`Error downloading file: ${filePath}`, err);
                    }
                });
            } else {
                console.log(`No local file found matching the criteria in ${replayFolder}`);
                res.status(404).send('Matching replay file not found on local disk.');
            }
        } catch (err) {
            console.error(`Error reading replay directory: ${replayFolder}`, err);
            res.status(500).send('Server error while searching for replay file.');
        }
    });
    
    httpsServer = https.createServer({ key: pems.private, cert: pems.cert }, expressApp);
    
    httpsServer.listen(PORT, () => {
        console.log(`Server running at https://localhost:${PORT}`);
        sendStatus('running', 'Server is Running');
    }).on('error', (err) => {
        console.error('Server error:', err);
        sendStatus('error', `Server Error: ${err.message}`);
    });
}

function createWindow() {
  win = new BrowserWindow({ width: 800, height: 600, webPreferences: { preload: path.join(__dirname, 'preload.js') } });
  win.loadFile('index.html');
  win.on('closed', () => { win = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (httpsServer) httpsServer.close();
    app.quit();
  }
});

ipcMain.on('enable-server', () => {
    if (!fs.existsSync(certPath)) {
        generateCerts();
    }
    
    const command = `certutil -addstore -f "ROOT" "${certPath}"`;
    sendStatus('info', 'Awaiting administrator permission...');
    
    sudo.exec(command, { name: 'BeatLeader Replay Server' }, (error, stdout, stderr) => {
        if (error) {
            console.error('Sudo prompt error:', error);
            sendStatus('error', 'Failed to trust certificate. Please try again.');
            return;
        }
        console.log('Certutil stdout:', stdout);
        console.log('Certutil stderr:', stderr);
        sendStatus('info', 'Certificate trusted! Starting server...');
        startServer();
    });
}); 