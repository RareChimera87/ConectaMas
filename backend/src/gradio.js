import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-0ea8619c34a94ab89d3a5c07b4e508ad',
});

const student = {
  nombre: "Santiago",
  edad: 8,
  intereses: ["robots", "videojuegos", "música"],
  interaccion: "baja, tímido con desconocidos",
  dificultades: "concentración limitada, necesita rutinas claras",
  objetivos: "mejorar interacción, motivación por aprender, desarrollo de habilidades motoras finas",
};

// Sistema experto en educación especial
const systemPrompt = `Eres un experto en educación y estimulación de niños con autismo. 
Tu especialidad es crear metodologías personalizadas basadas en los intereses y necesidades específicas de cada niño.

**INSTRUCCIONES ESPECÍFICAS:**
1. Analiza la información del estudiante proporcionada
2. Genera una metodología COMPLETA y ESTRUCTURADA
3. Usa lenguaje claro, práctico y aplicable
4. Incluye ejemplos concretos y actividades específicas
5. Mantén un tono empático y profesional

**FORMATO REQUERIDO:**
## 🎯 METODOLOGÍA PERSONALIZADA

### 📋 PERFIL DEL ESTUDIANTE
[Resumen conciso del niño]

### 🎯 OBJETIVOS DE INTERVENCIÓN
[Lista de objetivos específicos y medibles]

### 🎮 ACTIVIDADES ESTRATÉGICAS
[Actividades organizadas por áreas, usando sus intereses como base]

### 💡 ESTRATEGIAS PARA EL DOCENTE
[Consejos prácticos y técnicas específicas]

### 📊 SEGUIMIENTO Y EVALUACIÓN
[Cómo medir el progreso]`;

async function generateMethodology() {
  try {
    console.log("🧠 Generando metodología personalizada...\n");

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: `Genera una metodología personalizada para este estudiante:

**INFORMACIÓN DEL ESTUDIANTE:**
- **Nombre:** ${student.nombre}
- **Edad:** ${student.edad} años
- **Intereses principales:** ${student.intereses.join(", ")}
- **Nivel de interacción social:** ${student.interaccion}
- **Dificultades principales:** ${student.dificultades}
- **Objetivos de intervención:** ${student.objetivos}

**ENFOQUE REQUERIDO:**
Las actividades deben aprovechar sus intereses en robots, videojuegos y música para crear engagement. Considera sus dificultades de concentración y necesidad de rutinas claras.`
        }
      ],
      model: "deepseek-chat",
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    });

    const methodology = completion.choices[0].message.content;
    
    console.log("✅ METODOLOGÍA GENERADA EXITOSAMENTE:\n");
    console.log("=" .repeat(60));
    console.log(methodology);
    console.log("=" .repeat(60));
    
    return methodology;
    
  } catch (error) {
    console.error("❌ Error generando metodología:", error);
    throw error;
  }
}

// Función para generar metodología con parámetros personalizables
async function generateCustomMethodology(customStudent = null, customParams = {}) {
  const studentData = customStudent || student;
  
  const defaultParams = {
    max_tokens: 1500,
    temperature: 0.7,
    top_p: 0.9,
    include_evaluation: true
  };
  
  const params = { ...defaultParams, ...customParams };

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: `Genera una metodología para:
Nombre: ${studentData.nombre}
Edad: ${studentData.edad}
Intereses: ${studentData.intereses.join(", ")}
Interacción: ${studentData.interaccion}
Dificultades: ${studentData.dificultades}
Objetivos: ${studentData.objetivos}

${params.include_evaluation ? "Incluye sección de evaluación y seguimiento." : ""}`
        }
      ],
      model: "deepseek-chat",
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      top_p: params.top_p
    });

    return {
      success: true,
      methodology: completion.choices[0].message.content,
      usage: completion.usage,
      student: studentData
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      student: studentData
    };
  }
}

// Función para procesar múltiples estudiantes
async function processMultipleStudents(studentsArray) {
  const results = [];
  
  for (const student of studentsArray) {
    console.log(`\n📝 Procesando metodología para ${student.nombre}...`);
    
    const result = await generateCustomMethodology(student, {
      max_tokens: 1200,
      temperature: 0.8
    });
    
    results.push(result);
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Ejemplos de uso
async function main() {
  try {
    // 1. Generar metodología básica
    console.log("🚀 INICIANDO GENERACIÓN DE METODOLOGÍAS\n");
    
    const methodology = await generateMethodology();
    
    // 2. Ejemplo con parámetros personalizados
    console.log("\n\n🎛️  GENERANDO METODOLOGÍA CON PARÁMETROS PERSONALIZADOS...");
    
    const customResult = await generateCustomMethodology(null, {
      max_tokens: 2000,
      temperature: 0.8,
      include_evaluation: true
    });
    
    if (customResult.success) {
      console.log("✅ Metodología personalizada generada:");
      console.log(customResult.methodology.substring(0, 300) + "...");
      console.log(`📊 Tokens usados: ${customResult.usage?.total_tokens}`);
    }
    
    // 3. Ejemplo con múltiples estudiantes
    const multipleStudents = [
      {
        nombre: "Carlos",
        edad: 7,
        intereses: ["dinosaurios", "dibujo", "natureleza"],
        interaccion: "media, pero con ansiedad",
        dificultades: "frustración fácil, sensibilidad sensorial",
        objetivos: "manejo de emociones, habilidades sociales"
      },
      {
        nombre: "Lucía", 
        edad: 9,
        intereses: ["baile", "animales", "cuentos"],
        interaccion: "alta pero impulsiva",
        dificultades: "esperar turnos, seguir instrucciones múltiples",
        objetivos: "autorregulación, seguimiento de normas"
      }
    ];
    
    console.log("\n👥 PROCESANDO MÚLTIPLES ESTUDIANTES...");
    const batchResults = await processMultipleStudents(multipleStudents);
    
    console.log(`\n📈 RESUMEN: ${batchResults.filter(r => r.success).length}/${batchResults.length} metodologías generadas exitosamente`);
    
  } catch (error) {
    console.error("💥 Error en el proceso principal:", error);
  }
}

// Exportar funciones para usar en otros archivos
export {
  generateMethodology,
  generateCustomMethodology,
  processMultipleStudents
};

// Ejecutar si es el archivo principal
/* if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} */

main()