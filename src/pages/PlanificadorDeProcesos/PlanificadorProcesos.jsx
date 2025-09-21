import React, { useState } from 'react';
import './PlanificadorProcesos.css';
import { Simulador } from './components/Simulador';
import FCFS from './Estrategias/FCFS';
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
  const [ganttProcesses, setGanttProcesses] = useState([]);

  // Datos de Entrada
  const [initialProcesses, setInitialProcesses] = useState(defaultProcess);
  const [estrategia, setEstrategia] = useState(new FCFS());

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
        // Si el JSON es inválido, puedes volver a los valores por defecto
        setInitialProcesses(defaultProcess);
      }
    }
  };

  // Logica principal 
  const iniciarSimulacion = () => {
    
    // Se pasan los parámetros del formulario al constructor de la estrategia
    const estrategiaConParametros = new FCFS(formData.tip, formData.tfp, formData.tcp);
    // Para el caso de RoundRobin, se pasaría el quantum: new RoundRobin(formData.q, ...);

    // Creamos una nueva instancia del simulador
    const simulador = new Simulador(initialProcesses, estrategiaConParametros);

    // Ejecutamos la simulación
    const { schedule, totalTime, processes } = simulador.run();

    // Actualizamos el estado para el Gantt
    setSchedule(schedule);
    setTotalTime(totalTime);
    setGanttProcesses(processes);
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
        <Button onClick={iniciarSimulacion} name={"Iniciar Simulación " + estrategia.getName()} size="medium" />
      </div>
      <div className='planificador--procesos-container--gantt-chart'>
        <GanttChart schedule={schedule} processes={ganttProcesses} totalTime={totalTime} />
      </div>
    </div>
  );
}

export default PlanificadorProcesos;