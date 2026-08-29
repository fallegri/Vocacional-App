// ===========================================================================
// Contenido semilla - portado verbatim desde
// app/src/main/java/com/example/data/repository/SeedData.kt
// 60 preguntas (10 por dimensión, pares espejo 1<->7, 11<->17, 21<->27,
// 31<->37, 41<->47, 51<->57), 16 carreras con sus vectores ideales exactos,
// 4 cohortes por defecto y usuarios semilla.
// Todo el texto permanece en español.
// ===========================================================================

import type {
  AssessmentQuestion,
  Career,
  CohortGroup,
  AppUser,
} from "@/lib/riasec/types";

export const QUESTIONS: AssessmentQuestion[] = [
  // === R - REALISTA (10 reactivos) ===
  { id: 1, dimension: "R", category: "INTEREST", text: "Armar, reparar o configurar circuitos electrónicos, drones o equipos de computación.", mirrorPairId: 7 },
  { id: 2, dimension: "R", category: "INTEREST", text: "Trabajar al aire libre en contacto con la naturaleza, agricultura o conservación ambiental." },
  { id: 3, dimension: "R", category: "INTEREST", text: "Operar herramientas de precisión, maquinaria industrial o impresoras 3D." },
  { id: 4, dimension: "R", category: "INTEREST", text: "Inspeccionar construcciones, instalaciones eléctricas o redes de telecomunicaciones." },
  { id: 5, dimension: "R", category: "INTEREST", text: "Realizar diagnósticos mecánicos de vehículos, motores o sistemas hidráulicos." },
  { id: 6, dimension: "R", category: "INTEREST", text: "Cultivar plantas, criar animales o investigar técnicas de producción agropecuaria." },
  { id: 7, dimension: "R", category: "INTEREST", text: "Desarmar aparatos tecnológicos para comprender su funcionamiento interno y arreglarlos.", mirrorPairId: 1 },
  { id: 8, dimension: "R", category: "INTEREST", text: "Practicar deportes de aventura, actividades de rescate o trabajos de esfuerzo físico." },
  { id: 9, dimension: "R", category: "INTEREST", text: "Instalar paneles solares, turbinas eólicas o sistemas de energía renovable." },
  { id: 10, dimension: "R", category: "INTEREST", text: "Fabricar prototipos físicos de madera, metal o resina a partir de planos técnicos." },

  // === I - INVESTIGADOR (10 reactivos) ===
  { id: 11, dimension: "I", category: "INTEREST", text: "Investigar las causas científicas de una enfermedad o formular hipótesis de laboratorio.", mirrorPairId: 17 },
  { id: 12, dimension: "I", category: "INTEREST", text: "Analizar grandes volúmenes de datos o modelos matemáticos para predecir tendencias." },
  { id: 13, dimension: "I", category: "INTEREST", text: "Estudiar el comportamiento de las partículas cuánticas, astros o leyes de la física." },
  { id: 14, dimension: "I", category: "INTEREST", text: "Programar algoritmos complejos de inteligencia artificial o simulación computacional." },
  { id: 15, dimension: "I", category: "INTEREST", text: "Leer artículos científicos, papers y libros académicos sobre temas complejos." },
  { id: 16, dimension: "I", category: "INTEREST", text: "Diseñar experimentos controlados para validar teorías biológicas o químicas." },
  { id: 17, dimension: "I", category: "INTEREST", text: "Dedicar horas a resolver acertijos lógicos o problemas matemáticos intrincados.", mirrorPairId: 11 },
  { id: 18, dimension: "I", category: "INTEREST", text: "Analizar muestras celulares o ADN mediante biotecnología y microscopía." },
  { id: 19, dimension: "I", category: "INTEREST", text: "Examinar fenómenos psicológicos o neurológicos para entender el cerebro humano." },
  { id: 20, dimension: "I", category: "INTEREST", text: "Evaluar el impacto ambiental y ecológico de proyectos industriales con rigor metodológico." },

  // === A - ARTÍSTICO (10 reactivos) ===
  { id: 21, dimension: "A", category: "INTEREST", text: "Diseñar interfaces visuales innovadoras, animaciones 3D o identidades de marca.", mirrorPairId: 27 },
  { id: 22, dimension: "A", category: "INTEREST", text: "Escribir historias, guiones cinematográficos, poesías o artículos de opinión creativa." },
  { id: 23, dimension: "A", category: "INTEREST", text: "Componer música, tocar instrumentos o producir pistas sonoras digitales." },
  { id: 24, dimension: "A", category: "INTEREST", text: "Fotografiar eventos culturales, dirigir proyectos audiovisuales o escenografía." },
  { id: 25, dimension: "A", category: "INTEREST", text: "Diseñar espacios arquitectónicos, interiores o vestuario con estética vanguardista." },
  { id: 26, dimension: "A", category: "INTEREST", text: "Pintar, ilustrar digitalmente o crear esculturas y obras de arte visual." },
  { id: 27, dimension: "A", category: "INTEREST", text: "Expresar ideas y emociones mediante creaciones visuales o multimedia originales.", mirrorPairId: 21 },
  { id: 28, dimension: "A", category: "INTEREST", text: "Trabajar en entornos abiertos y flexibles sin reglas rígidas que limiten la imaginación." },
  { id: 29, dimension: "A", category: "INTEREST", text: "Idear conceptos publicitarios llamativos que generen impacto emocional en el público." },
  { id: 30, dimension: "A", category: "INTEREST", text: "Crear mundos virtuales, personajes y narrativas para videojuegos interactivos." },

  // === S - SOCIAL (10 reactivos) ===
  { id: 31, dimension: "S", category: "INTEREST", text: "Enseñar conceptos difíciles a estudiantes y ayudarlos a descubrir su potencial.", mirrorPairId: 37 },
  { id: 32, dimension: "S", category: "INTEREST", text: "Brindar contención emocional, psicoterapia o asesoría a personas en crisis." },
  { id: 33, dimension: "S", category: "INTEREST", text: "Organizar proyectos de voluntariado comunitario para mejorar la calidad de vida barrial." },
  { id: 34, dimension: "S", category: "INTEREST", text: "Cuidar pacientes, rehabilitar personas lesionadas o asistir a adultos mayores." },
  { id: 35, dimension: "S", category: "INTEREST", text: "Mediar en conflictos interpersonales para lograr acuerdos pacíficos y constructivos." },
  { id: 36, dimension: "S", category: "INTEREST", text: "Capacitar grupos humanos en habilidades blandas, liderazgo y trabajo en equipo." },
  { id: 37, dimension: "S", category: "INTEREST", text: "Orientar vocacionalmente y acompañar a jóvenes en su desarrollo personal.", mirrorPairId: 31 },
  { id: 38, dimension: "S", category: "INTEREST", text: "Defender los derechos humanos y asesorar a poblaciones vulnerables." },
  { id: 39, dimension: "S", category: "INTEREST", text: "Coordinar actividades recreativas, deportivas o de integración social inclusiva." },
  { id: 40, dimension: "S", category: "INTEREST", text: "Trabajar en hospitales o centros de salud velando por el bienestar de los pacientes." },

  // === E - EMPRENDEDOR (10 reactivos) ===
  { id: 41, dimension: "E", category: "INTEREST", text: "Fundar una startup tecnológica o liderar un proyecto empresarial con alto crecimiento.", mirrorPairId: 47 },
  { id: 42, dimension: "E", category: "INTEREST", text: "Negociar contratos estratégicos, acuerdos comerciales y alianzas entre organizaciones." },
  { id: 43, dimension: "E", category: "INTEREST", text: "Persuadir a un auditorio o inversionistas sobre el potencial de una propuesta innovadora." },
  { id: 44, dimension: "E", category: "INTEREST", text: "Dirigir equipos multidisciplinarios tomando decisiones rápidas bajo presión y riesgo." },
  { id: 45, dimension: "E", category: "INTEREST", text: "Diseñar estrategias de ventas, marketing digital y posicionamiento en mercados globales." },
  { id: 46, dimension: "E", category: "INTEREST", text: "Postularse para cargos de representación estudiantil, política o gremial." },
  { id: 47, dimension: "E", category: "INTEREST", text: "Identificar oportunidades de negocio rentables donde otros ven problemas cotidianos.", mirrorPairId: 41 },
  { id: 48, dimension: "E", category: "INTEREST", text: "Supervisar metas de facturación, rentabilidad y expansión de una compañía." },
  { id: 49, dimension: "E", category: "INTEREST", text: "Liderar campañas de recaudación de fondos o rondas de capital de riesgo." },
  { id: 50, dimension: "E", category: "INTEREST", text: "Motivar a las personas para alcanzar objetivos ambiciosos y superar cuotas." },

  // === C - CONVENCIONAL (10 reactivos) ===
  { id: 51, dimension: "C", category: "INTEREST", text: "Llevar la contabilidad, balances financieros y declaraciones tributarias con exactitud.", mirrorPairId: 57 },
  { id: 52, dimension: "C", category: "INTEREST", text: "Organizar bases de datos masivas asegurando integridad, seguridad y respaldo." },
  { id: 53, dimension: "C", category: "INTEREST", text: "Auditar procesos empresariales para verificar el cumplimiento estricto de normativas ISO." },
  { id: 54, dimension: "C", category: "INTEREST", text: "Elaborar presupuestos detallados, cronogramas de Gantt y control de costos." },
  { id: 55, dimension: "C", category: "INTEREST", text: "Gestionar archivos digitales clasificados, inventarios y logística documental." },
  { id: 56, dimension: "C", category: "INTEREST", text: "Redactar contratos formales, actas notariales o manuales de procedimientos operativos." },
  { id: 57, dimension: "C", category: "INTEREST", text: "Mantener registros financieros estructurados y conciliar cuentas bancarias al detalle.", mirrorPairId: 51 },
  { id: 58, dimension: "C", category: "INTEREST", text: "Optimizar flujos de trabajo administrativos para eliminar errores y duplicidades." },
  { id: 59, dimension: "C", category: "INTEREST", text: "Monitorear el cumplimiento de políticas de ciberseguridad y acceso a sistemas." },
  { id: 60, dimension: "C", category: "INTEREST", text: "Analizar métricas de rendimiento operacional utilizando hojas de cálculo avanzadas." },
];

export const CAREERS: Career[] = [
  {
    id: 1,
    title: "Ingeniería de Software e Inteligencia Artificial",
    areaName: "Tecnología e Informática",
    description:
      "Diseño, arquitectura y desarrollo de aplicaciones cloud, redes neuronales, plataformas web y sistemas autónomos escalables.",
    workEnvironment:
      "Empresas tecnológicas globales, centros de I+D, trabajo remoto, laboratorios de software.",
    idealR: 40, idealI: 90, idealA: 35, idealS: 25, idealE: 45, idealC: 75,
    keySkills: ["Algoritmos & Estructuras de Datos", "Python & Kotlin/Java", "Machine Learning", "Arquitectura Cloud"],
    futureTrends: "Alta demanda impulsada por IA generativa, edge computing y sistemas distribuidos.",
  },
  {
    id: 2,
    title: "Biotecnología y Bioinformática",
    areaName: "Ciencias de la Vida y Salud",
    description:
      "Investigación genómica, desarrollo de fármacos, terapias avanzadas y análisis biológico computacional.",
    workEnvironment:
      "Laboratorios farmacéuticos, centros de investigación genética, institutos biológicos.",
    idealR: 55, idealI: 95, idealA: 20, idealS: 30, idealE: 25, idealC: 65,
    keySkills: ["Biología Molecular", "Genómica Computacional", "Método Científico", "Bioestadística"],
    futureTrends: "Revolución de edición genética CRISPR y medicina personalizada de precisión.",
  },
  {
    id: 3,
    title: "Diseño Digital, UX/UI y Producto",
    areaName: "Arte, Diseño y Comunicación",
    description:
      "Investigación de usuarios, diseño de interfaces táctiles/web, prototipado interactivo y sistemas de diseño visual.",
    workEnvironment:
      "Agencias digitales, startups, estudios de videojuegos, laboratorios de innovación.",
    idealR: 25, idealI: 45, idealA: 95, idealS: 55, idealE: 45, idealC: 35,
    keySkills: ["Figma & Prototipado", "Design Thinking", "Investigación UX", "Tipografía & Color"],
    futureTrends: "Interfaces conversacionales por IA, realidad espacial y diseño centrado en accesibilidad.",
  },
  {
    id: 4,
    title: "Medicina Humana y Cirugía",
    areaName: "Ciencias Médicas y Salud",
    description:
      "Diagnóstico, tratamiento clínico, preservación de la vida y atención integral de la salud humana.",
    workEnvironment:
      "Hospitales de alta complejidad, clínicas, quirófanos, centros de atención primaria.",
    idealR: 50, idealI: 90, idealA: 15, idealS: 90, idealE: 35, idealC: 55,
    keySkills: ["Fisiología & Anatomía", "Razonamiento Clínico", "Empatía & Comunicación", "Cirugía & Procedimientos"],
    futureTrends: "Telemedicina, diagnóstico asistido por IA y cirugía robótica minimamente invasiva.",
  },
  {
    id: 5,
    title: "Administración y Dirección de Startups",
    areaName: "Negocios, Estrategia y Finanzas",
    description:
      "Estrategia de crecimiento corporativo, levantamiento de capital, liderazgo de equipos y apertura de nuevos mercados.",
    workEnvironment:
      "Aceleradoras de negocios, empresas multinacionales, fondos de inversión, consultoras.",
    idealR: 15, idealI: 35, idealA: 25, idealS: 65, idealE: 95, idealC: 70,
    keySkills: ["Estrategia de Negocios", "Negociación", "Finanzas Corporativas", "Liderazgo Adaptativo"],
    futureTrends: "Modelos de economía circular, startups impulsadas por datos y liderazgo descentralizado.",
  },
  {
    id: 6,
    title: "Ciencia de Datos y Analítica Avanzada",
    areaName: "Tecnología y Matemáticas",
    description:
      "Extracción de conocimiento a partir de big data, modelado econométrico, minería de datos y visualización estadística.",
    workEnvironment:
      "Banca de inversión, empresas tecnológicas, centros de investigación social y de mercado.",
    idealR: 30, idealI: 95, idealA: 25, idealS: 25, idealE: 40, idealC: 85,
    keySkills: ["SQL & Python", "Estadística Bayesiana", "Modelos Predictivos", "Visualización de Datos"],
    futureTrends: "Consolidación de Big Data como el activo estratégico central de las industrias modernas.",
  },
  {
    id: 7,
    title: "Psicología Clínica y Neurociencias",
    areaName: "Salud Mental y Ciencias Sociales",
    description:
      "Evaluación psicoterapéutica, neuropsicología, tratamiento de trastornos emocionales y salud conductual.",
    workEnvironment:
      "Consultorios privados, hospitales psiquiátricos, centros comunitarios, laboratorios cerebrales.",
    idealR: 20, idealI: 80, idealA: 30, idealS: 95, idealE: 30, idealC: 40,
    keySkills: ["Escucha Activa", "Evaluación Psicométrica", "Terapia Cognitivo-Conductual", "Neuropsicología"],
    futureTrends: "Mayor concienciación de salud mental en empresas, escuelas y plataformas digitales.",
  },
  {
    id: 8,
    title: "Ingeniería en Robótica y Mecatrónica",
    areaName: "Ingeniería y Fabricación",
    description:
      "Integración de mecánica, electrónica, sensores de control y software para automatización industrial y robótica.",
    workEnvironment:
      "Plantas automotrices, laboratorios aeroespaciales, almacenes automatizados, robótica médica.",
    idealR: 85, idealI: 85, idealA: 20, idealS: 15, idealE: 30, idealC: 60,
    keySkills: ["Microcontroladores", "Cinemática y Dinámica", "C++ / ROS", "Sistemas Embebidos"],
    futureTrends: "Robótica colaborativa (Cobots), drones autónomos y micro-mecanismos para exploración.",
  },
  {
    id: 9,
    title: "Arquitectura y Urbanismo Sostenible",
    areaName: "Arte, Diseño y Construcción",
    description:
      "Diseño de edificios bioambientales, planificación urbana inteligente, paisajismo y modelado BIM 3D.",
    workEnvironment:
      "Estudios de arquitectura, constructoras, dependencias de planeamiento urbano, terreno de obra.",
    idealR: 55, idealI: 60, idealA: 90, idealS: 35, idealE: 45, idealC: 65,
    keySkills: ["Modelado BIM / Revit", "Diseño Bioclimático", "Estructuras", "Planificación Territorial"],
    futureTrends: "Ciudades inteligentes (Smart Cities), edificios carbono neutral y materiales regenerativos.",
  },
  {
    id: 10,
    title: "Ciberseguridad y Seguridad Ofensiva",
    areaName: "Seguridad de la Información",
    description:
      "Defensa perimetral, ethical hacking, análisis forense digital y protección contra ataques a infraestructuras críticas.",
    workEnvironment:
      "Centros SOC de seguridad, entidades gubernamentales, banca, empresas de consultoría.",
    idealR: 60, idealI: 85, idealA: 20, idealS: 20, idealE: 35, idealC: 85,
    keySkills: ["Ethical Hacking", "Criptografía", "Seguridad de Redes", "Respuesta a Incidentes"],
    futureTrends: "Protección frente a ciberamenazas complejas asistidas por IA y criptografía post-cuántica.",
  },
  {
    id: 11,
    title: "Marketing Digital, Growth & E-commerce",
    areaName: "Negocios y Comunicación",
    description:
      "Campañas de adquisición omnicanal, analítica web, embudos de conversión, branding y viralización.",
    workEnvironment:
      "Agencias de marketing, multinacionales de consumo masivo, plataformas de comercio electrónico.",
    idealR: 15, idealI: 45, idealA: 70, idealS: 60, idealE: 90, idealC: 60,
    keySkills: ["Performance Marketing", "Copywriting Persuasivo", "Google/Meta Ads", "Analítica de Conversión"],
    futureTrends: "Personalización en tiempo real mediante IA predictiva y live commerce interactivo.",
  },
  {
    id: 12,
    title: "Ingeniería Ambiental y Energías Renovables",
    areaName: "Sustentabilidad y Recursos Naturales",
    description:
      "Proyectos de descarbonización, parques eólicos/solares, tratamiento de aguas y remediación ecológica.",
    workEnvironment:
      "Campos solares y eólicos, consultoras ambientales, organismos de regulación, terreno.",
    idealR: 75, idealI: 80, idealA: 20, idealS: 45, idealE: 40, idealC: 55,
    keySkills: ["Evaluación de Impacto Ambiental", "Energía Solar y Eólica", "Hidráulica Ambiental", "Normativas ISO 14001"],
    futureTrends: "Transición energética global, hidrógeno verde y captura directa de carbono.",
  },
  {
    id: 13,
    title: "Derecho, Relaciones Internacionales y Diplomacia",
    areaName: "Ciencias Jurídicas y Políticas",
    description:
      "Defensa jurídica, litigación, mediación internacional, tratados comerciales y asesoramiento regulatorio.",
    workEnvironment:
      "Cortes de justicia, bufetes jurídicos, embajadas, organismos multilaterales (ONU, OEA).",
    idealR: 10, idealI: 60, idealA: 35, idealS: 75, idealE: 85, idealC: 75,
    keySkills: ["Oratoria & Argumentación", "Derecho Corporativo", "Negociación de Tratados", "Ética Pública"],
    futureTrends: "Regulación de inteligencia artificial, derecho cibernético y gobernanza climática internacional.",
  },
  {
    id: 14,
    title: "Contabilidad Pública, Finanzas Cuantitativas & Auditoría",
    areaName: "Finanzas y Economía",
    description:
      "Estructuración de estados financieros, planificación fiscal, valoración de activos y auditoría corporativa.",
    workEnvironment:
      "Firmas 'Big Four', bancos de inversión, departamentos financieros corporativos.",
    idealR: 15, idealI: 60, idealA: 10, idealS: 30, idealE: 65, idealC: 95,
    keySkills: ["Normas NIIF / GAAP", "Modelado Financiero", "Auditoría Fiscal", "Excel Financiero & ERP"],
    futureTrends: "Automatización contable mediante RPA y blockchain en trazabilidad de transacciones.",
  },
  {
    id: 15,
    title: "Comunicación Audiovisual y Creación de Contenido",
    areaName: "Arte y Medios de Comunicación",
    description:
      "Producción cinematográfica, periodismo investigativo, dirección de podcasts y narrativa transmedia.",
    workEnvironment:
      "Estudios de televisión, plataformas de streaming, canales digitales, rodajes en exteriores.",
    idealR: 35, idealI: 50, idealA: 95, idealS: 65, idealE: 60, idealC: 30,
    keySkills: ["Dirección Audiovisual", "Edición Premiere / DaVinci", "Storytelling", "Producción Ejecutiva"],
    futureTrends: "Contenidos inmersivos para streaming y producción virtual en sets LED interactivos.",
  },
  {
    id: 16,
    title: "Pedagogía, Innovación Educativa y EdTech",
    areaName: "Educación y Formación",
    description:
      "Diseño de experiencias de aprendizaje, metodologías activas (STEAM), gamificación y plataformas EdTech.",
    workEnvironment:
      "Universidades, colegios innovadores, empresas de tecnología educativa, ministerios de educación.",
    idealR: 20, idealI: 60, idealA: 50, idealS: 95, idealE: 45, idealC: 55,
    keySkills: ["Diseño Instruccional", "Metodologías Activas", "Empatía Pedagógica", "Tecnología Educativa"],
    futureTrends: "Plataformas de aprendizaje adaptativo personalizadas por IA y micro-credenciales.",
  },
];

export const DEFAULT_COHORTS: CohortGroup[] = [
  {
    code: "ING-2026-A",
    title: "Ingeniería, Tecnología & Datos 2026",
    institution: "Instituto Tecnológico Superior",
    creatorName: "Carlos Mendoza (Admin Test)",
    isActive: true,
    description: "Cohorte de aspirantes a carreras STEM y ciencias exactas.",
  },
  {
    code: "COL-SAN-MARTIN-6B",
    title: "6to Año B - Bachillerato General",
    institution: "Colegio Nacional San Martín",
    creatorName: "Fernando Allegri (Admin Principal)",
    isActive: true,
    description: "Grupo de graduandos para diagnóstico vocacional integral.",
  },
  {
    code: "MED-SALUD-2026",
    title: "Ciencias Médicas y Asistencia 2026",
    institution: "Facultad de Medicina y Ciencias de la Salud",
    creatorName: "Sofía Ramos (Revisora Vocacional)",
    isActive: true,
    description: "Evaluación vocacional para medicina, enfermería y psicología.",
  },
  {
    code: "UNIV-VOC-2026",
    title: "Programa Abierto Preuniversitario",
    institution: "OrientApp Global Academy",
    creatorName: "Fernando Allegri (Admin Principal)",
    isActive: true,
    description: "Acceso libre para estudiantes independientes.",
  },
];

export const DEFAULT_USERS: AppUser[] = [
  {
    id: "user_super_admin",
    email: "admin.director@orientapp.edu",
    displayName: "Lic. Fernando Allegri (Director)",
    role: "SUPER_ADMIN",
    authProvider: "GOOGLE",
    institution: "OrientApp Central",
  },
  {
    id: "user_test_admin",
    email: "coordinador.test@orientapp.edu",
    displayName: "Prof. Carlos Mendoza (Coord. Psicométrico)",
    role: "TEST_ADMIN",
    authProvider: "GOOGLE",
    institution: "Instituto Tecnológico Superior",
  },
  {
    id: "user_report_reviewer",
    email: "orientadora.psico@orientapp.edu",
    displayName: "Lic. Sofía Ramos (Gabinete Psicopedagógico)",
    role: "REPORT_REVIEWER",
    authProvider: "GOOGLE",
    institution: "Colegio San Martín & Med-Salud",
  },
  {
    id: "user_student_gmail",
    email: "fernando.allegri@gmail.com",
    displayName: "Fernando Allegri (Estudiante)",
    role: "STUDENT",
    cohortCode: "ING-2026-A",
    authProvider: "GOOGLE",
    institution: "Colegio Nacional San Martín",
  },
];
