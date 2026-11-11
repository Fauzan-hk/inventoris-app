const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || "inventaris-db",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "inventaris",
  user: process.env.DB_USER || "inventaris",
  password: process.env.DB_PASSWORD || "latihan-ganti-123",
  connectionTimeoutMillis: 3000,
});

const alatAwal = [
  ["INV-001", "Laptop praktik", 20, "tersedia"],
  ["INV-002", "Switch 24 port", 6, "tersedia"],
  ["INV-003", "Router", 4, "dipinjam"],
  ["INV-004", "Crimping tool", 15, "tersedia"],
  ["INV-005", "LAN tester", 12, "tersedia"],
  ["INV-006", "Multimeter", 10, "tersedia"],
  ["INV-007", "Set obeng", 18, "tersedia"],
  ["INV-008", "Proyektor", 3, "rusak"],
];

let basisDataSiap = false;

async function siapkanBasisData() {
  for (let percobaan = 1; percobaan <= 15; percobaan++) {
    try {
      await pool.query(
        "CREATE TABLE IF NOT EXISTS alat (kode varchar(10) PRIMARY KEY, " +
        "nama varchar(100), stok integer, status varchar(20))"
      );
      for (const a of alatAwal) {
        await pool.query(
          "INSERT INTO alat (kode, nama, stok, status) VALUES ($1, $2, $3, $4) " +
          "ON CONFLICT (kode) DO NOTHING", a
        );
      }
      basisDataSiap = true;
      console.log("Basis data siap. Tabel alat terhubung.");
      return;
    } catch (err) {
      console.log("Menunggu basis data, percobaan " + percobaan + ": " + err.code);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

app.get("/api/alat", async (req, res) => {
  try {
    const hasil = await pool.query(
      "SELECT kode, nama, stok, status FROM alat ORDER BY kode");
    res.json(hasil.rows);
  } catch (err) {
    res.status(503).json({ galat: "basis data belum siap", kode: err.code });
  }
});

app.get("/api/kesehatan", (req, res) => {
  res.json({ layanan: "inventaris-lab", status: "berjalan",
    basisData: basisDataSiap ? "terhubung" : "belum terhubung" });
});

app.get("/", async (req, res) => {
  try {
    const hasil = await pool.query(
      "SELECT kode, nama, stok, status FROM alat ORDER BY kode");
    const baris = hasil.rows.map((a) =>
      "<tr><td>" + a.kode + "</td><td>" + a.nama + "</td><td>" +
      a.stok + "</td><td>" + a.status + "</td></tr>").join("");
    res.send("<h1>InventarisLab</h1>" +
      "<p>Daftar alat laboratorium komputer (dari basis data PostgreSQL)</p>" +
      "<table border=\"1\">" +
      "<tr><th>Kode</th><th>Nama alat</th><th>Stok</th><th>Status</th></tr>" +
      baris + "</table>");
  } catch (err) {
    res.status(503).send("<h1>InventarisLab</h1><p>Basis data belum siap.</p>");
  }
});

app.listen(port, () => {
  console.log("InventarisLab berjalan pada port " + port);
  siapkanBasisData();
});
