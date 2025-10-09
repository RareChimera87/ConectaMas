import express from "express";
import cors from "cors";
import supabase from "./supabase.js";
import { z } from "zod";


const userSchema = z.object({
  name: z.string().min(2),
  cel: z.string().min(10).max(12).trim(),
  email: z.string().email(),
  role: z.enum(["admin", "teacher", "student"]),
});

const evaluationSchema = z.object({
  date: z.string(), // fecha de la evaluación en ISO
  clinician: z.string(), // nombre del profesional
  diagnosis: z.string(), // tipo de autismo o comentarios clínicos
  cognitive: z
    .object({
      iq: z.number().optional(),
      attention: z.enum(["low", "medium", "high"]).optional(),
      memory: z.enum(["low", "medium", "high"]).optional(),
    })
    .optional(),
  social: z
    .object({
      eye_contact: z.enum(["poor", "average", "good"]).optional(),
      interaction: z.enum(["poor", "average", "good"]).optional(),
      communication: z.enum(["poor", "average", "good"]).optional(),
    })
    .optional(),
  sensory: z
    .object({
      tactile: z.enum(["hypo", "normal", "hyper"]).optional(),
      auditory: z.enum(["hypo", "normal", "hyper"]).optional(),
      visual: z.enum(["hypo", "normal", "hyper"]).optional(),
    })
    .optional(),
  interests: z.array(z.string()).optional(),
  recommendations: z.string().optional(),
});

const studentSchema = z.object({
  name: z.string().min(2),
  age: z.number().min(3).max(100),
  email_contact: z.string().email(),
  cel_contact: z.string().min(10).max(14).trim(),
  evaluation: z.string(),
  active: z.boolean().default(true),
  deficiency: z.string().optional(),
});

const app = express();
app.use(cors({ origin: "http://localhost:4321" }));

app.use(express.json());
const port = 3000;

// Usuarios

app.get("/api/users", async (req, res) => {
  /* const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token requerido" });

  const { data, error } = await supabase.auth.getUser(token); */
  const rol = "admin";
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});

app.post("/api/users", async (req, res) => {
  try {
    const validatedUser = userSchema.parse(req.body);

    const { name, cel, email, role } = validatedUser;
    const { data, error } = await supabase
      .from("students")
      .insert([{ name, cel, email, role }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues;
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: "Error del servidor" });
  }
});

app.delete("/api/users", async (req, res) => {
  const id = 1;
  const { data, error } = await supabase.from("users").delete().eq("id", id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const validatedUser = userSchema.parse(req.body);
    const id = parseInt(req.params.id, 10);
    const { name, cel, email, role } = validatedUser;
    const { data, error } = await supabase
      .from("users")
      .update({ name, cel, email, role })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues;
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Estudiantes

app.get("/api/students", async (req, res) => {
  /* const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token requerido" });

  const { data, error } = await supabase.auth.getUser(token); */
  const rol = "admin";
  const { data, error } = await supabase.from("students").select("*");
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});
app.get("/api/students/:id", async (req, res) => {
  /* const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token requerido" });

  const { data, error } = await supabase.auth.getUser(token); */
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});

app.post("/api/students", async (req, res) => {
  try {
    const validatedStudent = studentSchema.parse(req.body);
    const {
      name,
      age,
      email_contact,
      cel_contact,
      evaluation,
      active,
      deficiency,
    } = validatedStudent;
    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          name,
          age,
          email_contact,
          cel_contact,
          evaluation,
          active,
          deficiency,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues;
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: "Error del servidor" });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase.from("students").delete().eq("id", id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.send(data);
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const validatedStudent = studentSchema.parse(req.body);
    const id = parseInt(req.params.id, 10);
    const {
      name,
      age,
      email_contact,
      cel_contact,
      evaluation,
      active,
      deficiency,
    } = validatedStudent;
    const { data, error } = await supabase
      .from("students")
      .update({
        name,
        age,
        email_contact,
        cel_contact,
        evaluation,
        active,
        deficiency,
      })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues;
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: "Error del servidor" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// login

app.post("/api/login", async (req, res) => {
  const { email } = req.body;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    return res.status(401).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  const { data: sessionData, error: sessionError } =
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "http://localhost:4321/dashboard" },
    });
  if (sessionError) {
    return res.status(500).json({ error: sessionError.message });
  }

  res.json({ message: "OTP enviado, revisa tu correo" });
});
