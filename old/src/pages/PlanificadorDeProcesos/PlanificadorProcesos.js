import React from 'react'
import "./PlanificadorProcesos.css"
import GanttChart from './components/GanttChart';

function PlanificadorProcesos() {

  // RR quantum 2
  const processes = ["P1", "P2", "P3"];
  const schedule = [
  { process: "P1", start: 0, end: 3, type: "cpu" },
  { process: "P1", start: 3, end: 5, type: "io" },
  { process: "P2", start: 3, end: 11, type: "cpu" },
  { process: "P2", start: 11, end: 18, type: "io" },
  { process: "P3", start: 11, end: 20, type: "cpu" },
  { process: "P3", start: 20, end: 21, type: "io" },
  { process: "P1", start: 20, end: 24, type: "cpu" },
];

  return (
    <div className='planificador-procesos-container'>
      <h1>Simulador - Planificador de Procesos</h1>
      <div className='planificador--procesos-container--gantt-chart'>
        <GanttChart schedule={schedule} processes={processes} totalTime={30} />
      </div>
    </div>
  )
}

export default PlanificadorProcesos