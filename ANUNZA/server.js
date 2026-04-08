import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());

let db;

// conexión a la base de datos
async function conectarDB() {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "buscador_app"
  });

  console.log("Conectado a MySQL");
}

// endpoint
app.get("/api/buscar", async (req, res) => {
  const { trabajo = "" } = req.query;

  const query = `
    SELECT s.* FROM servicios s
    JOIN categorias c ON s.categoria_id = c.id
    WHERE c.nombre LIKE ?
  `;

  const [rows] = await db.query(query, [`%${trabajo}%`]);

  res.json(rows);
});

// iniciar servidor
app.listen(3000, async () => {
  await conectarDB();
  console.log("Servidor corriendo en http://localhost:3000");
});

app.get("/api/categorias", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM categorias");
  res.json(rows);
});