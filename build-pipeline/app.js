import express from 'express';
import deployRouter from './script.js';
import cors from 'cors';
const app = express();
app.use(express.json()); // For parsing JSON request bodies
app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.use('/api', deployRouter); // Mount the router at /api

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Build pipeline API server running on port ${PORT}`);
});