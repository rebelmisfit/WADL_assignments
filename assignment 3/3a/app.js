import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const port = 3000;

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});


app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
