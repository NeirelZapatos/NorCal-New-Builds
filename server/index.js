import express from "express";
import cors from "cors";
import pg from "pg";

const port = 3000;
const app = express();
const corsOptions = {
    origin: ['http://localhost:5173']
};

const db = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "NorCalNewBuilds",
    password: "9kxtEC%M5%^2N92B",
    port: 5432
});

app.use(cors(corsOptions));

app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM homes");
    res.json({ houses: result.rows });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});