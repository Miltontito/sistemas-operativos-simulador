import React, { useState } from 'react';
import './PlanificadorProcesos.css';
// Importamos el nuevo Simulador que ahora se encuentra en la raíz
import Simulador from './components/Simulador'; 
// Importamos las clases de estrategia
import FCFS from './Estrategias/FCFS';
import RoundRobin from './Estrategias/RoundRobin';
import SPN from './Estrategias/SPN';
import SRTN from './Estrategias/SRTN';
import PrioridadExterna from './Estrategias/PrioridadExterna';

import GanttChart from './components/GanttChart';
import Button from '../../components/Button/Button';
import DynamicForm from '../../components/DynamicForm/DynamicForm';

const defaultProcess = [
  { nombre: "P1", tiempo_arribo: 0, cantidad_rafagas_cpu: 4, duracion_rafaga_cpu: 3, duracion_rafaga_es: 2, prioridad_externa: 3 },
  { nombre: "P2", tiempo_arribo: 1, cantidad_rafagas_cpu: 2, duracion_rafaga_cpu: 8, duracion_rafaga_es: 5, prioridad_externa: 1 },
  { nombre: "P3", tiempo_arribo: 3, cantidad_rafagas_cpu: 5, duracion_rafaga_cpu: 2, duracion_rafaga_es: 1, prioridad_externa: 4 },
  { nombre: "P4", tiempo_arribo: 6, cantidad_rafagas_cpu: 3, duracion_rafaga_cpu: 6, duracion_rafaga_es: 4, prioridad_externa: 2 },
  { nombre: "P5", tiempo_arribo: 10, cantidad_rafagas_cpu: 1, duracion_rafaga_cpu: 10, duracion_rafaga_es: 0, prioridad_externa: 5 },
];

function PlanificadorProcesos() {
  // Datos necesarios para el Gantt
  const [schedule, setSchedule] = useState([]);
  const [totalTime, setTotalTime] = useState(0);

  // Datos de Entrada
  const [initialProcesses, setInitialProcesses] = useState(defaultProcess);
  const [estrategiaSeleccionada, setEstrategiaSeleccionada] = useState('FCFS');

  // Datos de los formularios
  const [formData, setFormData] = useState({
    q: 0, // Valor por defecto
    tip: 0,
    tfp: 0,
    tcp: 0,
  });
  const [procesosJson, setProcesosJson] = useState(JSON.stringify(defaultProcess, null, 2));

  // Handle para los formularios de entrada
  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // Handle para el JSON
  const handleChangeProcesos = (name, value) => {
    setProcesosJson(value);
    if (name === "json") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setInitialProcesses(parsed);
        } else {
          console.error("El JSON debe ser un array de objetos");
        }
      } catch (error) {
        console.error("JSON inválido:", error.message);
        setInitialProcesses(defaultProcess);
      }
    }
  };

  // Estrategias disponibles para el selector, con sus parámetros.
  // Ahora, las instancias se crean dentro de iniciarSimulacion.
  const estrategiasDisponibles = {
    FCFS: FCFS,
    "Round Robin": RoundRobin,
    SPN: SPN,
    SRTN: SRTN,
    "Prioridad Externa": PrioridadExterna,
  };

  // Lógica principal
  const iniciarSimulacion = () => {
    // 1. Instanciamos la clase de estrategia seleccionada.
    // Pasamos los parámetros de sistema al constructor del simulador, no a la estrategia.
    const EstrategiaClass = estrategiasDisponibles[estrategiaSeleccionada];
    const estrategiaInstance = new EstrategiaClass();
    
    // 2. Creamos la instancia del nuevo Simulador, pasando la estrategia y los parámetros de sistema.
    const simulador = new Simulador(
      estrategiaInstance,
      formData.tip,
      formData.tfp,
      formData.tcp,
      formData.q // El quantum se pasa aquí, no en la estrategia
    );

    // 3. Ejecutamos la simulación, pasando los procesos a simular.
    const { schedule, totalTime } = simulador.simular(initialProcesses);

    // 4. Actualizamos los estados para el Gantt
    setSchedule(schedule);
    setTotalTime(totalTime);
    
    // Aquí puedes calcular los datos para las métricas si lo necesitas.
    // Por ejemplo, el tiempo de retorno.
    // El 'schedule' ahora contiene toda la información necesaria para el Gantt.
    // `ganttProcesses` ya no es necesario, puedes pasar `initialProcesses` al GanttChart.
  };

  const datosEntrada = [
    { label: "Quantum (q)", name: "q", type: "number", placeholder: "0" },
    { label: "Tiempo de Creacion (TIP)", name: "tip", type: "number", placeholder: "0" },
    { label: "Tiempo de Finalizacion (TFP)", name: "tfp", type: "number", placeholder: "0" },
    { label: "Tiempo de Cambio de Proceso (TCP)", name: "tcp", type: "number", placeholder: "0" },
  ];

  const entradaJson = [
    {
      label: "Entrada (JSON de Procesos)",
      name: "json",
      type: "json",
      placeholder: "Arreglo de Procesos...",
    },
  ];

  return (
    <div className='planificador-procesos-container'>
      <h1>Simulador - Planificador de Procesos</h1>
      <div className='planificador-procesos-container--input'>
        <div className='planificador-procesos-container--input--json'>
          <DynamicForm fields={entradaJson} values={{ json: procesosJson }} onChange={handleChangeProcesos} size='100%' />
        </div>
        <div className='planificador-procesos-container--input--form'>
          <DynamicForm fields={datosEntrada} values={formData} onChange={handleChange} />
        </div>
      </div>
      <div className='planificador-procesos-container--iniciar-simulacion-button'>
        <div className="planificador-procesos-container--selector">
          <label htmlFor="estrategia">Estrategia: </label>
          <select
            id="estrategia"
            value={estrategiaSeleccionada}
            onChange={(e) => {
              setEstrategiaSeleccionada(e.target.value);
            }}
          >
            {Object.keys(estrategiasDisponibles).map((nombre) => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
        </div>
        <Button onClick={iniciarSimulacion} name={"Iniciar Simulación con " + estrategiaSeleccionada} />
      </div>
      <div className='planificador--procesos-container--gantt-chart'>
        {/* Pasamos los procesos iniciales para que el Gantt sepa los nombres y colores */}
        <GanttChart schedule={schedule} processes={initialProcesses} totalTime={totalTime} />
      </div>
    </div>
  );
}

export default PlanificadorProcesos;