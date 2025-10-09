import { Request, Response } from "express";
import OpenAI from "openai";
import supabase from "../supabase.js";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

let SYSTEM_PROMPT = `Eres "Conecta+", un asistente especializado en educación y apoyo para niños con Trastorno del Espectro Autista (TEA). Tu rol es ser un consultor experto para profesores, terapeutas y cuidadores.

## CONTEXTO Y ROL:
- **Tú eres:** Un especialista en TEA con 15+ años de experiencia
- **Tu interlocutor es:** Un profesor/terapeuta que trabaja con niños autistas
- **Tu objetivo:** Proporcionar estrategias prácticas, herramientas concretas y metodologías basadas en evidencia

## FORMATO DE RESPUESTA:
Siempre estructura tus respuestas en este formato:

### 🎯 **Análisis del Caso**
[Breve resumen entendiendo la situación específica]

### 🧩 **Estrategias Recomendadas**
- [Estrategia 1 con explicación práctica]
- [Estrategia 2 con ejemplos concretos]
- [Estrategia 3 aplicable inmediatamente]

### 🛠️ **Herramientas Prácticas**
- **Visuales:** [Pictogramas, agendas visuales, etc.]
- **Sensoriales:** [Adaptaciones del ambiente]
- **Comunicativas:** [Sistemas alternativos si aplica]

### 📝 **Plan de Acción**
1. [Paso 1 específico y medible]
2. [Paso 2 con timeline]
3. [Paso 3 de evaluación]

### 💡 **Consejos para el Profesor**
- [Cómo implementar]
- [Qué evitar]
- [Señales de progreso]

## ÁREAS DE ENFOQUE PRINCIPAL:
1. **Comunicación y Lenguaje**
2. **Habilidades Sociales** 
3. **Regulación Emocional**
4. **Habilidades Académicas Adaptadas**
5. **Integración Sensorial**
6. **Rutinas y Estructura**
7. **Manejo de Conductas**

## ESTILO DE COMUNICACIÓN:
- Empático pero profesional
- Basado en evidencia científica
- Práctico y aplicable en aula/casa
- Motivador y esperanzador
- Respetuoso con la neurodiversidad

## INSTRUCCIÓN FINAL:
Nunca des consejos genéricos. Siempre personaliza según la información que te proporcionen sobre el niño específico (edad, intereses, desafíos, fortalezas). Usa ejemplos concretos y adapta las estrategias a los intereses del niño (robots, música, videojuegos, etc., según corresponda). Si no tienes suficiente información, pide más detalles específicos sobre el niño y su entorno antes de dar recomendaciones.

Enfócate en: comunicación, habilidades sociales, regulación emocional, adaptaciones académicas, integración sensorial, rutinas y manejo de conductas. Sé empático, práctico y basado en evidencia.`;

export const chatController = {
  // Crear nueva conversación
  createConversation: async (req: Request, res: Response) => {
    console.log("📥 Body recibido:", req.body);
    console.log("👤 Usuario:", (req as any).user);

    try {
      const { student_id } = req.body;
      const user_id = (req as any).user.id; // Del middleware de auth

      // Verificar que el estudiante pertenece al usuario
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, evaluation, deficiency, name, age")
        .eq("id", student_id)
        .single();

      if (studentError || !student) {
        return res.status(404).json({ error: "Estudiante no encontrado" });
      }
      const title = `Chat - ${new Date().toLocaleDateString()} - ${
        student.name
      }`;
      let PROMPT_PERSONALIZADO =
        SYSTEM_PROMPT +
        ` El estudiante tiene las siguientes características: nombre: ${student.name}, evaluacion: ${student.evaluation}, deficiencia: ${student.deficiency}, edad: ${student.age}. Adapta tus respuestas a estas características. `;

      // Crear conversación
      const { data: conversation, error } = await supabase
        .from("conversations")
        .insert({
          user_id,
          student_id,
          title,
        })
        .select()
        .single();

      if (error) {
        console.log("eeeeeeeeeeeeeeeeee");
        throw error;
      }

      // Mensaje inicial del sistema
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "system",
        content: PROMPT_PERSONALIZADO,
      });

      res.json({
        success: true,
        conversation,
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Error creando conversación",
        details: error.message,
      });
    }
  },

  // Enviar mensaje al chat
  sendMessage: async (req: Request, res: Response) => {
    console.log("📨 Mensaje recibido:", req.body);
    try {
      const { conversation_id, message } = req.body;
      console.log("🔍 Datos:", { conversation_id, message });
      const user_id = (req as any).user.id;

      // Verificar que la conversación pertenece al usuario
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: "Conversación no encontrada" });
      }

      // 1. Guardar mensaje del usuario
      const { data: userMessage, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id,
          role: "user",
          content: message,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // 2. Obtener historial (últimos 15 mensajes)
      const { data: history, error: historyError } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true })
        .limit(15);

      if (historyError) throw historyError;

      // 3. Llamar a DeepSeek
      const completion = await openai.chat.completions.create({
        messages: history.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
        model: "deepseek-chat",
        max_tokens: 1000,
        temperature: 0.7,
      });

      const assistantResponse = completion.choices[0]?.message.content;
      const tokensUsed = completion.usage?.total_tokens;

      // 4. Guardar respuesta del asistente
      const { data: assistantMessage, error: assistantError } = await supabase
        .from("messages")
        .insert({
          conversation_id,
          role: "assistant",
          content: assistantResponse!,
          tokens: tokensUsed,
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      // 5. Actualizar timestamp de la conversación
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversation_id);

      res.json({
        success: true,
        message: assistantMessage,
        tokens: tokensUsed,
      });
    } catch (error: any) {
      console.error("Error en sendMessage:", error);
      res.status(500).json({
        error: "Error procesando mensaje",
        details: error.message,
      });
    }
  },

  // Obtener conversación con mensajes
  getConversation: async (req: Request, res: Response) => {
    try {
      const { conversation_id } = req.params;
      const user_id = (req as any).user.id;

      // Verificar permisos
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: "Conversación no encontrada" });
      }

      // Obtener mensajes
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      res.json({
        success: true,
        messages,
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Error obteniendo conversación",
        details: error.message,
      });
    }
  },

  // Listar conversaciones de un estudiante
  getStudentConversations: async (req: Request, res: Response) => {
    try {
      const { student_id } = req.params;
      const user_id = (req as any).user.id;

      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("student_id", student_id)
        .eq("user_id", user_id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        conversations,
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Error obteniendo conversaciones",
        details: error.message,
      });
    }
  },
};
