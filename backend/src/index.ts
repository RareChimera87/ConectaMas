import express from "express";
import cors from "cors";
import supabase from './supabase.js'
import {z} from "zod";


const app = express();
app.use(cors({ origin: "http://localhost:4321" }));

app.use(express.json());
const port = 3000;

// Usuarios

app.get("/api/users", async(req, res) => {
  /* const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token requerido" });

  const { data, error } = await supabase.auth.getUser(token); */
  const rol = 'admin'
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});

// Estudiantes

app.get("/api/students", async(req, res) => {
  /* const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token requerido" });

  const { data, error } = await supabase.auth.getUser(token); */
  const rol = 'admin'
  const { data, error } = await supabase.from('students').select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});

app.post("/api/students", async(req, res) => {
  const { name, age, email_contact, cel_contact, evaluation, active, deficiency } = req.body;

  console.log(req.body)

  const { data, error } = await supabase
    .from('students')
    .insert([{ name, age, email_contact, cel_contact, evaluation, active, deficiency }])
    .select();
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.delete("/api/students", async(req, res) => {

  const id = 1
  const { data, error } = await supabase.from('students').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});

app.put("/api/students", async(req, res) => {

  const id = 2
  const { name, age, email_contact, cel_contact, evaluation, active, deficiency } = req.body;
  const { data, error } = await supabase.from('students').update({ name, age, email_contact, cel_contact, evaluation, active, deficiency }).eq('id', id).select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});
  