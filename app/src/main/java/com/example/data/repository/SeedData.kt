package com.example.data.repository

import com.example.data.model.AssessmentQuestion
import com.example.data.model.Career
import com.example.data.model.DimensionCode

object SeedData {

    val QUESTIONS: List<AssessmentQuestion> = listOf(
        // === R - REALISTA (10 reactivos) ===
        AssessmentQuestion(1, DimensionCode.R, "Armar, reparar o configurar circuitos electrónicos, drones o equipos de computación.", mirrorPairId = 7),
        AssessmentQuestion(2, DimensionCode.R, "Trabajar al aire libre en contacto con la naturaleza, agricultura o conservación ambiental."),
        AssessmentQuestion(3, DimensionCode.R, "Operar herramientas de precisión, maquinaria industrial o impresoras 3D."),
        AssessmentQuestion(4, DimensionCode.R, "Inspeccionar construcciones, instalaciones eléctricas o redes de telecomunicaciones."),
        AssessmentQuestion(5, DimensionCode.R, "Realizar diagnósticos mecánicos de vehículos, motores o sistemas hidráulicos."),
        AssessmentQuestion(6, DimensionCode.R, "Cultivar plantas, criar animales o investigar técnicas de producción agropecuaria."),
        AssessmentQuestion(7, DimensionCode.R, "Desarmar aparatos tecnológicos para comprender su funcionamiento interno y arreglarlos.", mirrorPairId = 1),
        AssessmentQuestion(8, DimensionCode.R, "Practicar deportes de aventura, actividades de rescate o trabajos de esfuerzo físico."),
        AssessmentQuestion(9, DimensionCode.R, "Instalar paneles solares, turbinas eólicas o sistemas de energía renovable."),
        AssessmentQuestion(10, DimensionCode.R, "Fabricar prototipos físicos de madera, metal o resina a partir de planos técnicos."),

        // === I - INVESTIGADOR (10 reactivos) ===
        AssessmentQuestion(11, DimensionCode.I, "Investigar las causas científicas de una enfermedad o formular hipótesis de laboratorio.", mirrorPairId = 17),
        AssessmentQuestion(12, DimensionCode.I, "Analizar grandes volúmenes de datos o modelos matemáticos para predecir tendencias."),
        AssessmentQuestion(13, DimensionCode.I, "Estudiar el comportamiento de las partículas cuánticas, astros o leyes de la física."),
        AssessmentQuestion(14, DimensionCode.I, "Programar algoritmos complejos de inteligencia artificial o simulación computacional."),
        AssessmentQuestion(15, DimensionCode.I, "Leer artículos científicos, papers y libros académicos sobre temas complejos."),
        AssessmentQuestion(16, DimensionCode.I, "Diseñar experimentos controlados para validar teorías biológicas o químicas."),
        AssessmentQuestion(17, DimensionCode.I, "Dedicar horas a resolver acertijos lógicos o problemas matemáticos intrincados.", mirrorPairId = 11),
        AssessmentQuestion(18, DimensionCode.I, "Analizar muestras celulares o ADN mediante biotecnología y microscopía."),
        AssessmentQuestion(19, DimensionCode.I, "Examinar fenómenos psicológicos o neurológicos para entender el cerebro humano."),
        AssessmentQuestion(20, DimensionCode.I, "Evaluar el impacto ambiental y ecológico de proyectos industriales con rigor metodológico."),

        // === A - ARTÍSTICO (10 reactivos) ===
        AssessmentQuestion(21, DimensionCode.A, "Diseñar interfaces visuales innovadoras, animaciones 3D o identidades de marca.", mirrorPairId = 27),
        AssessmentQuestion(22, DimensionCode.A, "Escribir historias, guiones cinematográficos, poesías o artículos de opinión creativa."),
        AssessmentQuestion(23, DimensionCode.A, "Componer música, tocar instrumentos o producir pistas sonoras digitales."),
        AssessmentQuestion(24, DimensionCode.A, "Fotografiar eventos culturales, dirigir proyectos audiovisuales o escenografía."),
        AssessmentQuestion(25, DimensionCode.A, "Diseñar espacios arquitectónicos, interiores o vestuario con estética vanguardista."),
        AssessmentQuestion(26, DimensionCode.A, "Pintar, ilustrar digitalmente o crear esculturas y obras de arte visual."),
        AssessmentQuestion(27, DimensionCode.A, "Expresar ideas y emociones mediante creaciones visuales o multimedia originales.", mirrorPairId = 21),
        AssessmentQuestion(28, DimensionCode.A, "Trabajar en entornos abiertos y flexibles sin reglas rígidas que limiten la imaginación."),
        AssessmentQuestion(29, DimensionCode.A, "Idear conceptos publicitarios llamativos que generen impacto emocional en el público."),
        AssessmentQuestion(30, DimensionCode.A, "Crear mundos virtuales, personajes y narrativas para videojuegos interactivos."),

        // === S - SOCIAL (10 reactivos) ===
        AssessmentQuestion(31, DimensionCode.S, "Enseñar conceptos difíciles a estudiantes y ayudarlos a descubrir su potencial.", mirrorPairId = 37),
        AssessmentQuestion(32, DimensionCode.S, "Brindar contención emocional, psicoterapia o asesoría a personas en crisis."),
        AssessmentQuestion(33, DimensionCode.S, "Organizar proyectos de voluntariado comunitario para mejorar la calidad de vida barrial."),
        AssessmentQuestion(34, DimensionCode.S, "Cuidar pacientes, rehabilitar personas lesionadas o asistir a adultos mayores."),
        AssessmentQuestion(35, DimensionCode.S, "Mediar en conflictos interpersonales para lograr acuerdos pacíficos y constructivos."),
        AssessmentQuestion(36, DimensionCode.S, "Capacitar grupos humanos en habilidades blandas, liderazgo y trabajo en equipo."),
        AssessmentQuestion(37, DimensionCode.S, "Orientar vocacionalmente y acompañar a jóvenes en su desarrollo personal.", mirrorPairId = 31),
        AssessmentQuestion(38, DimensionCode.S, "Defender los derechos humanos y asesorar a poblaciones vulnerables."),
        AssessmentQuestion(39, DimensionCode.S, "Coordinar actividades recreativas, deportivas o de integración social inclusiva."),
        AssessmentQuestion(40, DimensionCode.S, "Trabajar en hospitales o centros de salud velando por el bienestar de los pacientes."),

        // === E - EMPRENDEDOR (10 reactivos) ===
        AssessmentQuestion(41, DimensionCode.E, "Fundar una startup tecnológica o liderar un proyecto empresarial con alto crecimiento.", mirrorPairId = 47),
        AssessmentQuestion(42, DimensionCode.E, "Negociar contratos estratégicos, acuerdos comerciales y alianzas entre organizaciones."),
        AssessmentQuestion(43, DimensionCode.E, "Persuadir a un auditorio o inversionistas sobre el potencial de una propuesta innovadora."),
        AssessmentQuestion(44, DimensionCode.E, "Dirigir equipos multidisciplinarios tomando decisiones rápidas bajo presión y riesgo."),
        AssessmentQuestion(45, DimensionCode.E, "Diseñar estrategias de ventas, marketing digital y posicionamiento en mercados globales."),
        AssessmentQuestion(46, DimensionCode.E, "Postularse para cargos de representación estudiantil, política o gremial."),
        AssessmentQuestion(47, DimensionCode.E, "Identificar oportunidades de negocio rentables donde otros ven problemas cotidianos.", mirrorPairId = 41),
        AssessmentQuestion(48, DimensionCode.E, "Supervisar metas de facturación, rentabilidad y expansión de una compañía."),
        AssessmentQuestion(49, DimensionCode.E, "Liderar campañas de recaudación de fondos o rondas de capital de riesgo."),
        AssessmentQuestion(50, DimensionCode.E, "Motivar a las personas para alcanzar objetivos ambiciosos y superar cuotas."),

        // === C - CONVENCIONAL (10 reactivos) ===
        AssessmentQuestion(51, DimensionCode.C, "Llevar la contabilidad, balances financieros y declaraciones tributarias con exactitud.", mirrorPairId = 57),
        AssessmentQuestion(52, DimensionCode.C, "Organizar bases de datos masivas asegurando integridad, seguridad y respaldo."),
        AssessmentQuestion(53, DimensionCode.C, "Auditar procesos empresariales para verificar el cumplimiento estricto de normativas ISO."),
        AssessmentQuestion(54, DimensionCode.C, "Elaborar presupuestos detallados, cronogramas de Gantt y control de costos."),
        AssessmentQuestion(55, DimensionCode.C, "Gestionar archivos digitales clasificados, inventarios y logística documental."),
        AssessmentQuestion(56, DimensionCode.C, "Redactar contratos formales, actas notariales o manuales de procedimientos operativos."),
        AssessmentQuestion(57, DimensionCode.C, "Mantener registros financieros estructurados y conciliar cuentas bancarias al detalle.", mirrorPairId = 51),
        AssessmentQuestion(58, DimensionCode.C, "Optimizar flujos de trabajo administrativos para eliminar errores y duplicidades."),
        AssessmentQuestion(59, DimensionCode.C, "Monitorear el cumplimiento de políticas de ciberseguridad y acceso a sistemas."),
        AssessmentQuestion(60, DimensionCode.C, "Analizar métricas de rendimiento operacional utilizando hojas de cálculo avanzadas.")
    )

    val CAREERS: List<Career> = listOf(
        Career(
            id = 1,
            title = "Ingeniería de Software e Inteligencia Artificial",
            areaName = "Tecnología e Informática",
            description = "Diseño, arquitectura y desarrollo de aplicaciones cloud, redes neuronales, plataformas web y sistemas autónomos escalables.",
            workEnvironment = "Empresas tecnológicas globales, centros de I+D, trabajo remoto, laboratorios de software.",
            idealR = 40f, idealI = 90f, idealA = 35f, idealS = 25f, idealE = 45f, idealC = 75f,
            keySkills = listOf("Algoritmos & Estructuras de Datos", "Python & Kotlin/Java", "Machine Learning", "Arquitectura Cloud"),
            futureTrends = "Alta demanda impulsada por IA generativa, edge computing y sistemas distribuidos."
        ),
        Career(
            id = 2,
            title = "Biotecnología y Bioinformática",
            areaName = "Ciencias de la Vida y Salud",
            description = "Investigación genómica, desarrollo de fármacos, terapias avanzadas y análisis biológico computacional.",
            workEnvironment = "Laboratorios farmacéuticos, centros de investigación genética, institutos biológicos.",
            idealR = 55f, idealI = 95f, idealA = 20f, idealS = 30f, idealE = 25f, idealC = 65f,
            keySkills = listOf("Biología Molecular", "Genómica Computacional", "Método Científico", "Bioestadística"),
            futureTrends = "Revolución de edición genética CRISPR y medicina personalizada de precisión."
        ),
        Career(
            id = 3,
            title = "Diseño Digital, UX/UI y Producto",
            areaName = "Arte, Diseño y Comunicación",
            description = "Investigación de usuarios, diseño de interfaces táctiles/web, prototipado interactivo y sistemas de diseño visual.",
            workEnvironment = "Agencias digitales, startups, estudios de videojuegos, laboratorios de innovación.",
            idealR = 25f, idealI = 45f, idealA = 95f, idealS = 55f, idealE = 45f, idealC = 35f,
            keySkills = listOf("Figma & Prototipado", "Design Thinking", "Investigación UX", "Tipografía & Color"),
            futureTrends = "Interfaces conversacionales por IA, realidad espacial y diseño centrado en accesibilidad."
        ),
        Career(
            id = 4,
            title = "Medicina Humana y Cirugía",
            areaName = "Ciencias Médicas y Salud",
            description = "Diagnóstico, tratamiento clínico, preservación de la vida y atención integral de la salud humana.",
            workEnvironment = "Hospitales de alta complejidad, clínicas, quirófanos, centros de atención primaria.",
            idealR = 50f, idealI = 90f, idealA = 15f, idealS = 90f, idealE = 35f, idealC = 55f,
            keySkills = listOf("Fisiología & Anatomía", "Razonamiento Clínico", "Empatía & Comunicación", "Cirugía & Procedimientos"),
            futureTrends = "Telemedicina, diagnóstico asistido por IA y cirugía robótica minimamente invasiva."
        ),
        Career(
            id = 5,
            title = "Administración y Dirección de Startups",
            areaName = "Negocios, Estrategia y Finanzas",
            description = "Estrategia de crecimiento corporativo, levantamiento de capital, liderazgo de equipos y apertura de nuevos mercados.",
            workEnvironment = "Aceleradoras de negocios, empresas multinacionales, fondos de inversión, consultoras.",
            idealR = 15f, idealI = 35f, idealA = 25f, idealS = 65f, idealE = 95f, idealC = 70f,
            keySkills = listOf("Estrategia de Negocios", "Negociación", "Finanzas Corporativas", "Liderazgo Adaptativo"),
            futureTrends = "Modelos de economía circular, startups impulsadas por datos y liderazgo descentralizado."
        ),
        Career(
            id = 6,
            title = "Ciencia de Datos y Analítica Avanzada",
            areaName = "Tecnología y Matemáticas",
            description = "Extracción de conocimiento a partir de big data, modelado econométrico, minería de datos y visualización estadística.",
            workEnvironment = "Banca de inversión, empresas tecnológicas, centros de investigación social y de mercado.",
            idealR = 30f, idealI = 95f, idealA = 25f, idealS = 25f, idealE = 40f, idealC = 85f,
            keySkills = listOf("SQL & Python", "Estadística Bayesiana", "Modelos Predictivos", "Visualización de Datos"),
            futureTrends = "Consolidación de Big Data como el activo estratégico central de las industrias modernas."
        ),
        Career(
            id = 7,
            title = "Psicología Clínica y Neurociencias",
            areaName = "Salud Mental y Ciencias Sociales",
            description = "Evaluación psicoterapéutica, neuropsicología, tratamiento de trastornos emocionales y salud conductual.",
            workEnvironment = "Consultorios privados, hospitales psiquiátricos, centros comunitarios, laboratorios cerebrales.",
            idealR = 20f, idealI = 80f, idealA = 30f, idealS = 95f, idealE = 30f, idealC = 40f,
            keySkills = listOf("Escucha Activa", "Evaluación Psicométrica", "Terapia Cognitivo-Conductual", "Neuropsicología"),
            futureTrends = "Mayor concienciación de salud mental en empresas, escuelas y plataformas digitales."
        ),
        Career(
            id = 8,
            title = "Ingeniería en Robótica y Mecatrónica",
            areaName = "Ingeniería y Fabricación",
            description = "Integración de mecánica, electrónica, sensores de control y software para automatización industrial y robótica.",
            workEnvironment = "Plantas automotrices, laboratorios aeroespaciales, almacenes automatizados, robótica médica.",
            idealR = 85f, idealI = 85f, idealA = 20f, idealS = 15f, idealE = 30f, idealC = 60f,
            keySkills = listOf("Microcontroladores", "Cinemática y Dinámica", "C++ / ROS", "Sistemas Embebidos"),
            futureTrends = "Robótica colaborativa (Cobots), drones autónomos y micro-mecanismos para exploración."
        ),
        Career(
            id = 9,
            title = "Arquitectura y Urbanismo Sostenible",
            areaName = "Arte, Diseño y Construcción",
            description = "Diseño de edificios bioambientales, planificación urbana inteligente, paisajismo y modelado BIM 3D.",
            workEnvironment = "Estudios de arquitectura, constructoras, dependencias de planeamiento urbano, terreno de obra.",
            idealR = 55f, idealI = 60f, idealA = 90f, idealS = 35f, idealE = 45f, idealC = 65f,
            keySkills = listOf("Modelado BIM / Revit", "Diseño Bioclimático", "Estructuras", "Planificación Territorial"),
            futureTrends = "Ciudades inteligentes (Smart Cities), edificios carbono neutral y materiales regenerativos."
        ),
        Career(
            id = 10,
            title = "Ciberseguridad y Seguridad Ofensiva",
            areaName = "Seguridad de la Información",
            description = "Defensa perimetral, ethical hacking, análisis forense digital y protección contra ataques a infraestructuras críticas.",
            workEnvironment = "Centros SOC de seguridad, entidades gubernamentales, banca, empresas de consultoría.",
            idealR = 60f, idealI = 85f, idealA = 20f, idealS = 20f, idealE = 35f, idealC = 85f,
            keySkills = listOf("Ethical Hacking", "Criptografía", "Seguridad de Redes", "Respuesta a Incidentes"),
            futureTrends = "Protección frente a ciberamenazas complejas asistidas por IA y criptografía post-cuántica."
        ),
        Career(
            id = 11,
            title = "Marketing Digital, Growth & E-commerce",
            areaName = "Negocios y Comunicación",
            description = "Campañas de adquisición omnicanal, analítica web, embudos de conversión, branding y viralización.",
            workEnvironment = "Agencias de marketing, multinacionales de consumo masivo, plataformas de comercio electrónico.",
            idealR = 15f, idealI = 45f, idealA = 70f, idealS = 60f, idealE = 90f, idealC = 60f,
            keySkills = listOf("Performance Marketing", "Copywriting Persuasivo", "Google/Meta Ads", "Analítica de Conversión"),
            futureTrends = "Personalización en tiempo real mediante IA predictiva y live commerce interactivo."
        ),
        Career(
            id = 12,
            title = "Ingeniería Ambiental y Energías Renovables",
            areaName = "Sustentabilidad y Recursos Naturales",
            description = "Proyectos de descarbonización, parques eólicos/solares, tratamiento de aguas y remediación ecológica.",
            workEnvironment = "Campos solares y eólicos, consultoras ambientales, organismos de regulación, terreno.",
            idealR = 75f, idealI = 80f, idealA = 20f, idealS = 45f, idealE = 40f, idealC = 55f,
            keySkills = listOf("Evaluación de Impacto Ambiental", "Energía Solar y Eólica", "Hidráulica Ambiental", "Normativas ISO 14001"),
            futureTrends = "Transición energética global, hidrógeno verde y captura directa de carbono."
        ),
        Career(
            id = 13,
            title = "Derecho, Relaciones Internacionales y Diplomacia",
            areaName = "Ciencias Jurídicas y Políticas",
            description = "Defensa jurídica, litigación, mediación internacional, tratados comerciales y asesoramiento regulatorio.",
            workEnvironment = "Cortes de justicia, bufetes jurídicos, embajadas, organismos multilaterales (ONU, OEA).",
            idealR = 10f, idealI = 60f, idealA = 35f, idealS = 75f, idealE = 85f, idealC = 75f,
            keySkills = listOf("Oratoria & Argumentación", "Derecho Corporativo", "Negociación de Tratados", "Ética Pública"),
            futureTrends = "Regulación de inteligencia artificial, derecho cibernético y gobernanza climática internacional."
        ),
        Career(
            id = 14,
            title = "Contabilidad Pública, Finanzas Cuantitativas & Auditoría",
            areaName = "Finanzas y Economía",
            description = "Estructuración de estados financieros, planificación fiscal, valoración de activos y auditoría corporativa.",
            workEnvironment = "Firmas 'Big Four', bancos de inversión, departamentos financieros corporativos.",
            idealR = 15f, idealI = 60f, idealA = 10f, idealS = 30f, idealE = 65f, idealC = 95f,
            keySkills = listOf("Normas NIIF / GAAP", "Modelado Financiero", "Auditoría Fiscal", "Excel Financiero & ERP"),
            futureTrends = "Automatización contable mediante RPA y blockchain en trazabilidad de transacciones."
        ),
        Career(
            id = 15,
            title = "Comunicación Audiovisual y Creación de Contenido",
            areaName = "Arte y Medios de Comunicación",
            description = "Producción cinematográfica, periodismo investigativo, dirección de podcasts y narrativa transmedia.",
            workEnvironment = "Estudios de televisión, plataformas de streaming, canales digitales, rodajes en exteriores.",
            idealR = 35f, idealI = 50f, idealA = 95f, idealS = 65f, idealE = 60f, idealC = 30f,
            keySkills = listOf("Dirección Audiovisual", "Edición Premiere / DaVinci", "Storytelling", "Producción Ejecutiva"),
            futureTrends = "Contenidos inmersivos para streaming y producción virtual en sets LED interactivos."
        ),
        Career(
            id = 16,
            title = "Pedagogía, Innovación Educativa y EdTech",
            areaName = "Educación y Formación",
            description = "Diseño de experiencias de aprendizaje, metodologías activas (STEAM), gamificación y plataformas EdTech.",
            workEnvironment = "Universidades, colegios innovadores, empresas de tecnología educativa, ministerios de educación.",
            idealR = 20f, idealI = 60f, idealA = 50f, idealS = 95f, idealE = 45f, idealC = 55f,
            keySkills = listOf("Diseño Instruccional", "Metodologías Activas", "Empatía Pedagógica", "Tecnología Educativa"),
            futureTrends = "Plataformas de aprendizaje adaptativo personalizadas por IA y micro-credenciales."
        )
    )

    val DEFAULT_COHORTS: List<com.example.data.model.CohortGroup> = listOf(
        com.example.data.model.CohortGroup(
            code = "ING-2026-A",
            title = "Ingeniería, Tecnología & Datos 2026",
            institution = "Instituto Tecnológico Superior",
            creatorName = "Carlos Mendoza (Admin Test)",
            description = "Cohorte de aspirantes a carreras STEM y ciencias exactas."
        ),
        com.example.data.model.CohortGroup(
            code = "COL-SAN-MARTIN-6B",
            title = "6to Año B - Bachillerato General",
            institution = "Colegio Nacional San Martín",
            creatorName = "Fernando Allegri (Admin Principal)",
            description = "Grupo de graduandos para diagnóstico vocacional integral."
        ),
        com.example.data.model.CohortGroup(
            code = "MED-SALUD-2026",
            title = "Ciencias Médicas y Asistencia 2026",
            institution = "Facultad de Medicina y Ciencias de la Salud",
            creatorName = "Sofía Ramos (Revisora Vocacional)",
            description = "Evaluación vocacional para medicina, enfermería y psicología."
        ),
        com.example.data.model.CohortGroup(
            code = "UNIV-VOC-2026",
            title = "Programa Abierto Preuniversitario",
            institution = "OrientApp Global Academy",
            creatorName = "Fernando Allegri (Admin Principal)",
            description = "Acceso libre para estudiantes independientes."
        )
    )

    val DEFAULT_USERS: List<com.example.data.model.AppUser> = listOf(
        com.example.data.model.AppUser(
            id = "user_super_admin",
            email = "admin.director@orientapp.edu",
            displayName = "Lic. Fernando Allegri (Director)",
            role = com.example.data.model.UserRole.SUPER_ADMIN,
            institution = "OrientApp Central"
        ),
        com.example.data.model.AppUser(
            id = "user_test_admin",
            email = "coordinador.test@orientapp.edu",
            displayName = "Prof. Carlos Mendoza (Coord. Psicométrico)",
            role = com.example.data.model.UserRole.TEST_ADMIN,
            institution = "Instituto Tecnológico Superior"
        ),
        com.example.data.model.AppUser(
            id = "user_report_reviewer",
            email = "orientadora.psico@orientapp.edu",
            displayName = "Lic. Sofía Ramos (Gabinete Psicopedagógico)",
            role = com.example.data.model.UserRole.REPORT_REVIEWER,
            institution = "Colegio San Martín & Med-Salud"
        ),
        com.example.data.model.AppUser(
            id = "user_student_gmail",
            email = "fernando.allegri@gmail.com",
            displayName = "Fernando Allegri (Estudiante)",
            role = com.example.data.model.UserRole.STUDENT,
            cohortCode = "ING-2026-A",
            authProvider = com.example.data.model.AuthProvider.GOOGLE,
            institution = "Colegio Nacional San Martín"
        )
    )
}

