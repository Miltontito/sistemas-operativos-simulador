import Proceso from './Proceso';

// Constante para el manejo de la precisión de punto flotante (anti-freeze fix)
const FLOAT_TOLERANCE = 0.001;

export default class Simulador {
  constructor(strategy, tip = 0, tfp = 0, tcp = 0, q = 0) {
    this.strategy = strategy;
    this.tip = Number(tip);
    this.tfp = Number(tfp);
    this.tcp = Number(tcp);
    this.q = Number(q);

    // Estado de la Simulación
    this.currentTime = 0;
    this.readyQueue = [];
    this.blockedQueue = [];
    this.finishedProcesses = [];
    this.schedule = [];
    this.simulacionProcesses = [];

    // Métricas
    this.tiempoSO = 0;
    this.tiempoProcesos = 0;
    this.tiempoOciosoCPU = 0;
    this.tiempoTotalSimulacion = 0;
    this.log = [];
  }

  // Método principal para iniciar la simulación
  simular(procesos) {
    this._initializeSimulation(procesos);

    while (this.finishedProcesses.length < this.simulacionProcesses.length) {
      
      this.manejarProcesosBloqueados();
      this.manejarProcesosNuevos();

      // 2. Manejo de tiempo OCIOSO (Idle)
      if (this.readyQueue.length === 0) {
        if (this._handleIdleTime()) {
          continue; // Si sigue vacía después del salto de tiempo
        }
      }

      // 3. Selección y Aplicación de TCP
      const procesoActual = this.strategy.seleccionarProceso(this.readyQueue);
      
      if (!procesoActual) {
        continue;
      }
      
      // ✅ Cálculo de Tiempo en Listo (CORRECCIÓN DE MÉTRICA)
      procesoActual.tiempoEnListo += this.currentTime - procesoActual.tiempoIngresoListo;

      // 4. Aplicar TCP
      this._applyOverhead(procesoActual.nombre, this.tcp, 'tcp', 'SELECCION', `Seleccionado. Comienza TCP.`);


      // 5. Calcular tiempo de ejecución (quantum / preemption)
      let tiempoEjecucion = this._calculateExecutionTime(procesoActual);
      
      if (tiempoEjecucion < FLOAT_TOLERANCE) {
         continue; // Si el tiempo es insignificante, pasar a la siguiente iteración
      }


      // Se ejecuta el proceso
      this.ejecutarProceso(procesoActual, tiempoEjecucion);
    }

    this.tiempoTotalSimulacion = this.currentTime;
    const metricas = this.calcularMetricas(this.tiempoTotalSimulacion);

    return {
      schedule: this.schedule,
      totalTime: this.tiempoTotalSimulacion,
      metricas: metricas,
      log: this.log,
    };
  }

  // --- MÉTODOS PRIVADOS/AYUDA ---

  _initializeSimulation(procesos) {
    this.simulacionProcesses = procesos.map(p => new Proceso(p));
    this.simulacionProcesses.sort((a, b) => a.tiempoArribo - b.tiempoArribo);

    this.currentTime = 0;
    this.readyQueue = [];
    this.blockedQueue = [];
    this.finishedProcesses = [];
    this.schedule = [];
    this.tiempoSO = 0;
    this.tiempoProcesos = 0;
    this.tiempoOciosoCPU = 0;
    this.log = [];

    this.simulacionProcesses.forEach(p => {
      p.rafagaCpuRestante = p.duracionRafagaCpu;
    });
  }

  /** Centraliza la aplicación de TIP, TCP y TFP. */
  _applyOverhead(processName, duration, type, logType, logMessage) {
    if (duration > 0) {
      this.schedule.push({
        process: processName,
        start: this.currentTime,
        end: this.currentTime + duration,
        type: type
      });
      this.currentTime += duration;
      this.tiempoSO += duration;
    }
    if (logType) {
      this.addLogEntry(logType, processName, logMessage);
    }
  }

  /** Calcula el tiempo que el proceso puede ejecutarse (quantum/preemption). */
  _calculateExecutionTime(procesoActual) {
    if (this.strategy.getName() === "Round Robin" && this.q > 0) {
      return Math.min(procesoActual.rafagaCpuRestante, this.q);
    }

    const isPreemptive = this.strategy.getName() === "SRTN" || this.strategy.getName() === "Prioridad Externa";

    if (isPreemptive) {
      const proxArribo = this.simulacionProcesses
        .filter(p => p.estado === "NUEVO" && p.tiempoArribo > this.currentTime)
        .map(p => p.tiempoArribo)
        .reduce((min, t) => Math.min(min, t), Infinity);

      const proxIo = this.blockedQueue
        .map(p => p.finIo)
        .reduce((min, t) => Math.min(min, t), Infinity);

      let tiempoHastaProximoEvento = Math.min(proxArribo, proxIo) - this.currentTime;

      // Anti-freeze: Si el tiempo es insignificante o negativo, ejecutar la ráfaga completa.
      if (tiempoHastaProximoEvento < FLOAT_TOLERANCE) {
        tiempoHastaProximoEvento = procesoActual.rafagaCpuRestante;
      }

      return Math.min(procesoActual.rafagaCpuRestante, tiempoHastaProximoEvento);

    } else { // FCFS, SPN, etc. (No preemptivos)
      return procesoActual.rafagaCpuRestante;
    }
  }

  /** Maneja el avance del tiempo cuando la CPU está ociosa. */
  _handleIdleTime() {
    const nextEventTime = this.calcularProximoEvento();

    if (nextEventTime !== Infinity && nextEventTime > this.currentTime) {
      // Si avanzamos el tiempo, la diferencia es tiempo ocioso
      this.tiempoOciosoCPU += nextEventTime - this.currentTime;
      this.currentTime = nextEventTime;

      // Re-chequear eventos que pudieron ocurrir en el salto
      this.manejarProcesosBloqueados();
      this.manejarProcesosNuevos();
    } else if (nextEventTime === Infinity) {
      return true; // Indica que la simulación debe terminar (break)
    }

    return this.readyQueue.length === 0; // true si la cola sigue vacía (continue)
  }

  // --- MÉTODOS DE TRANSICIÓN DE ESTADO ---

  // Maneja la transición de NUEVO a LISTO (TIP)
  manejarProcesosNuevos() {
    let index;
    while ((index = this.simulacionProcesses.findIndex(p => p.estado === 'NUEVO' && this.currentTime >= p.tiempoArribo)) !== -1) {
      const p = this.simulacionProcesses[index];

      this._applyOverhead(p.nombre, this.tip, 'tip', null, null);

      // Transición a LISTO
      p.estado = 'LISTO';
      p.tiempoIngresoListo = this.currentTime;
      this.readyQueue.push(p);

      this.addLogEntry('LISTO', p.nombre, `Pasa a LISTO después de TIP.`);
    }
  }

  // Maneja la transición de BLOQUEADO a LISTO
  manejarProcesosBloqueados() {
    const processesReadyNow = this.blockedQueue.filter(p => this.currentTime >= p.finIo);
    
    for (const p of processesReadyNow) {
      p.estado = 'LISTO';
      p.tiempoIngresoListo = this.currentTime;
      this.readyQueue.push(p);
      this.addLogEntry('FIN_IO', p.nombre, `Fin de I/O. Vuelve a LISTO.`);
    }
    
    this.blockedQueue = this.blockedQueue.filter(p => this.currentTime < p.finIo);
  }

  // Calcula el tiempo del próximo evento
  calcularProximoEvento() {
    const proxArribo = this.simulacionProcesses
      .filter(p => p.estado === "NUEVO")
      .map(p => p.tiempoArribo)
      .reduce((min, t) => Math.min(min, t), Infinity);

    const proxIo = this.blockedQueue
      .map(p => p.finIo)
      .reduce((min, t) => Math.min(min, t), Infinity);

    return Math.min(proxArribo, proxIo);
  }

  // Ejecuta el proceso y registra los tiempos de CPU
  ejecutarProceso(proceso, tiempoEjecucion) {
    
    this.addLogEntry('CPU_START', proceso.nombre, `Fin de TCP. Comienza ráfaga de CPU (duración ${tiempoEjecucion.toFixed(3)}).`);

    // 2. Ejecución de la ráfaga de CPU
    const startCpu = this.currentTime;
    const endCpu = startCpu + tiempoEjecucion;
    this.schedule.push({
      process: proceso.nombre,
      start: startCpu,
      end: endCpu,
      type: 'cpu'
    });
    this.currentTime = endCpu;
    this.tiempoProcesos += tiempoEjecucion;

    // 3. Actualización de estado
    proceso.rafagaCpuRestante -= tiempoEjecucion;

    if (proceso.rafagaCpuRestante < FLOAT_TOLERANCE) {
      proceso.rafagaCpuRestante = 0;
      
      // Ráfaga completa terminada
      proceso.rafagasRestantes--;
      proceso.rafagaCpuRestante = proceso.duracionRafagaCpu;

      if (proceso.rafagasRestantes === 0) {
        this.addLogEntry('TERMINADO', proceso.nombre, `Proceso completado. Tiempo de Finalización: ${this.currentTime.toFixed(3)}.`);
        this.finalizarProceso(proceso);
      } else {
        this.addLogEntry('FIN_CPU', proceso.nombre, `Fin de ráfaga #${proceso.cantidadRafagasCpu - proceso.rafagasRestantes}. Comienza TFP y E/S.`);
        this.bloquearProceso(proceso);
      }
    } else {
      // Ráfaga interrumpida (Quantum/Preemption)
      proceso.estado = 'LISTO';
      proceso.tiempoIngresoListo = this.currentTime;
      const reason = this.strategy.name === 'Round Robin' ? 'Quantum agotado' : 'Expropiado por arribo/mejor proceso';
      this.addLogEntry('INTERRUPCION', proceso.nombre, `${reason}. Vuelve a LISTO. Restante: ${proceso.rafagaCpuRestante.toFixed(3)}.`);
      this.readyQueue.push(proceso);
    }
  }

  // Maneja la transición de la CPU a BLOQUEADO
  bloquearProceso(proceso) {
    const startIo = this.currentTime;
    const endIo = startIo + proceso.duracionRafagaEs;
    this.schedule.push({
      process: proceso.nombre,
      start: startIo,
      end: endIo,
      type: 'io'
    });

    proceso.estado = 'BLOQUEADO';
    proceso.finIo = endIo;
    this.blockedQueue.push(proceso);
  }

  // Maneja la transición de la CPU a TERMINADO (TFP)
  finalizarProceso(proceso) {
    this._applyOverhead(proceso.nombre, this.tfp, 'tfp', null, null);
    
    proceso.estado = 'TERMINADO';
    proceso.tiempoFinalizacion = this.currentTime;
    this.finishedProcesses.push(proceso);
  }

  // --- MÉTODOS DE REGISTRO Y MÉTRICAS ---

  // Método para calcular y consolidar las métricas
  calcularMetricas(totalTime) {
    const totalSimTime = totalTime;

    // 1. Métricas por Proceso
    const metricasPorProceso = this.finishedProcesses.map(p => {
      const tiempoRetorno = p.tiempoFinalizacion - p.tiempoArribo;
      const tiempoServicio = p.cantidadRafagasCpu * p.duracionRafagaCpu;

      const tiempoRetornoNormalizado = tiempoServicio > 0 ? tiempoRetorno / tiempoServicio : 0;

      return {
        nombre: p.nombre,
        tiempoRetorno: tiempoRetorno.toFixed(3),
        tiempoRetornoNormalizado: tiempoRetornoNormalizado.toFixed(3),
        tiempoEnListo: p.tiempoEnListo.toFixed(3),
      };
    });

    // 2. Métricas por Tanda (Batch)
    const sumTiempoRetorno = metricasPorProceso.reduce((sum, p) => sum + Number(p.tiempoRetorno), 0);
    const tiempoMedioRetorno = metricasPorProceso.length > 0 ? sumTiempoRetorno / metricasPorProceso.length : 0;

    // 3. Métricas de CPU
    const porcentajeSO = (this.tiempoSO / totalSimTime) * 100;
    const porcentajeProcesos = (this.tiempoProcesos / totalSimTime) * 100;
    const porcentajeOciosa = (this.tiempoOciosoCPU / totalSimTime) * 100;

    const formatPercentage = (val) => isNaN(val) || totalSimTime === 0 ? "0.00%" : val.toFixed(2) + '%';
    const formatAbsolute = (val) => val.toFixed(3);

    return {
      porProceso: metricasPorProceso,
      porTanda: {
        tiempoTotalRetorno: formatAbsolute(sumTiempoRetorno),
        tiempoMedioRetorno: formatAbsolute(tiempoMedioRetorno),
      },
      cpu: {
        tiempoTotal: formatAbsolute(totalSimTime),
        ociosa: {
          absoluto: formatAbsolute(this.tiempoOciosoCPU),
          porcentaje: formatPercentage(porcentajeOciosa)
        },
        usadaSO: {
          absoluto: formatAbsolute(this.tiempoSO),
          porcentaje: formatPercentage(porcentajeSO)
        },
        utilizadaProcesos: {
          absoluto: formatAbsolute(this.tiempoProcesos),
          porcentaje: formatPercentage(porcentajeProcesos)
        }
      }
    };
  }
  
  addLogEntry(type, processName, description = '') {
    const proceso = this.simulacionProcesses.find(p => p.nombre === processName);

    this.log.push({
      time: this.currentTime.toFixed(3),
      arrivalTime: proceso ? proceso.tiempoArribo.toFixed(3) : null, 
      type: type,
      process: processName,
      description: description,
    });
  }

  // Método para descargar el log
  obtenerLogEnTexto() {
    const logText = this.log.map(entry => {
      let description = entry.description ? entry.description : '';
      return `[Tiempo: ${entry.time}] ${description} (Tipo: ${entry.type}, Proceso: ${entry.process})`;
    }).join('\n');

    return "Log de Simulación\n" + logText;
  }
}