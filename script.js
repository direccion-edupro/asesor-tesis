document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    /* ====== Claves de storage ====== */
    var STORAGE_KEY = 'thesisProgress';
    var STUDENT_KEY = 'thesisStudent';

    /* ====== Data por defecto (6 fases) ====== */
    var defaultThesisData = {
        projectInfo: {
            title: '',
            studentName: '',
            studentId: '',
            studentGroup: ''
        },
        stages: [
            { title: 'Fase 1: Elección y Delimitación del Tema', deadline: null, tasks: [ { description: 'Realizar lluvia de ideas sobre posibles temas.', completed: false }, { description: 'Investigar antecedentes de los temas seleccionados.', completed: false }, { description: 'Definir el tema final y delimitar su alcance.', completed: false } ], documents: [] },
            { title: 'Fase 2: Planteamiento del Problema', deadline: null, tasks: [ { description: 'Redactar la descripción del problema.', completed: false }, { description: 'Formular la pregunta de investigación principal.', completed: false }, { description: 'Formular preguntas de investigación secundarias.', completed: false }, { description: 'Escribir la justificación e importancia del estudio.', completed: false } ], documents: [] },
            { title: 'Fase 3: Construcción del Marco Teórico', deadline: null, tasks: [ { description: 'Identificar las bases teóricas clave.', completed: false }, { description: 'Buscar y recopilar literatura relevante (artículos, libros).', completed: false }, { description: 'Redactar los antecedentes de la investigación.', completed: false }, { description: 'Desarrollar los conceptos y teorías centrales.', completed: false } ], documents: [] },
            { title: 'Fase 4: Diseño Metodológico', deadline: null, tasks: [ { description: 'Definir el enfoque de la investigación (cualitativo, cuantitativo, mixto).', completed: false }, { description: 'Seleccionar y describir la población y muestra.', completed: false }, { description: 'Diseñar los instrumentos de recolección de datos.', completed: false }, { description: 'Describir el procedimiento para el análisis de datos.', completed: false } ], documents: [] },
            { title: 'Fase 5: Resultados y Discusión', deadline: null, tasks: [ { description: 'Preparar y depurar los datos / transcripciones.', completed: false }, { description: 'Realizar el análisis (estadístico o temático).', completed: false }, { description: 'Generar tablas, figuras y visualizaciones clave.', completed: false }, { description: 'Redactar resultados y discutirlos con el marco teórico.', completed: false } ], documents: [] },
            { title: 'Fase 6: Conclusiones y Recomendaciones', deadline: null, tasks: [ { description: 'Sintetizar hallazgos y responder a la pregunta de investigación.', completed: false }, { description: 'Redactar conclusiones alineadas con los objetivos.', completed: false }, { description: 'Formular recomendaciones aplicables (defensa y seguridad).', completed: false }, { description: 'Presentación y resumen ejecutivo de cierre.', completed: false } ], documents: [] }
        ]
    };

    /* ====== Utilidades ====== */
    function clone(x) { return JSON.parse(JSON.stringify(x)); }
    
    function loadData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var data = raw ? JSON.parse(raw) : clone(defaultThesisData);
            if (!data.projectInfo) data.projectInfo = clone(defaultThesisData.projectInfo);
            return data;
        } catch (e) {
            return clone(defaultThesisData);
        }
    }
    
    function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(thesisData)); }
    
    var thesisData = loadData();

    /* ====== Cache de nodos ====== */
    var roadmapContainer = document.getElementById('thesis-roadmap');
    var ganttChartContainer = document.getElementById('gantt-chart');
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    var projectTitleInput = document.getElementById('project-title');
    var studentNameInput = document.getElementById('student-name');
    var studentIdInput = document.getElementById('student-id');
    var studentGroupInput = document.getElementById('student-group');

    /* ====== Render y Lógica Principal ====== */
    function renderRoadmap() {
        if (!roadmapContainer) return;
        roadmapContainer.innerHTML = '';
        var prevCompleted = true;

        (thesisData.stages || []).forEach(function (stage, si) {
            var isCompleted = (stage.tasks && stage.tasks.length > 0) && stage.tasks.every(function (t) { return t.completed; });
            var isLocked = !prevCompleted;
            var isActive = !isLocked && !isCompleted;

            var stageEl = document.createElement('div');
            stageEl.className = 'stage';
            if (isLocked) stageEl.classList.add('locked');
            if (isCompleted) stageEl.classList.add('completed');
            if (!isActive) stageEl.classList.add('collapsed');
            
            var header = document.createElement('div');
            header.className = 'stage-header';
            header.innerHTML = `<h2>${stage.title}</h2>`;
            header.addEventListener('click', function () { if (!isLocked) stageEl.classList.toggle('collapsed'); });
            
            stageEl.appendChild(header);
            
            var content = document.createElement('div');
            content.className = 'stage-tasks';
            
            (stage.tasks || []).forEach(function (task, ti) {
                var row = document.createElement('div');
                row.className = 'task';
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = !!task.completed;
                cb.disabled = isLocked;
                cb.id = `task-${si}-${ti}`;
                cb.addEventListener('change', function () { toggleTask(si, ti); });
                
                var lab = document.createElement('label');
                lab.textContent = task.description;
                lab.setAttribute('for', `task-${si}-${ti}`);
                
                row.appendChild(cb);
                row.appendChild(lab);
                content.appendChild(row);
            });
            
            stageEl.appendChild(content);
            roadmapContainer.appendChild(stageEl);
            prevCompleted = isCompleted;
        });
    }

    function toggleTask(si, ti) {
        var t = thesisData.stages[si].tasks[ti];
        t.completed = !t.completed;
        saveData();
        renderAll();
    }

    function renderAll() {
        renderRoadmap();
        // Otras funciones de renderizado que puedas tener, como renderGanttChart()
    }
    
    renderAll();
});
