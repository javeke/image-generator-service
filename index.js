const express = require('express')
const htmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5500;
app.use(express.static('public'));

// Temporary
app.use(express.static('templates'));

app.get('/convert', async (req, res) => {

    const html = fs.readFileSync(path.join(__dirname, '/templates/center.html'), { encoding: 'utf-8'});
    const result = await htmlToImage({
        html, output: './output.png'
    });

    if (result)
        return res.sendFile(path.join(__dirname, '/output.png'));
    return res.send("Failed!");
});

app.listen(PORT, () => console.log("App started on port: "+PORT))