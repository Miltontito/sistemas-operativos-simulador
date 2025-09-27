import Proceso from './Proceso';

export default class Simulador {
  constructor(strategy, tip = 0, tfp = 0, tcp = 0, q = 0) {
    this.strategy = strategy;
    this.tip = Number(tip);
    this.tfp = Number(tfp);
    this.tcp = Number(tcp);
    this.q = Number(q);
    this.currentTime = 0;
    this.readyQueue = [];
    this.blockedQueue = [];
    this.finishedProcesses = [];
    this.schedule = [];
    this.simulacionProcesses = [];

    // METRICAS (NUEVO)
    this.tiempoSO = 0; // Tiempo usado por TIP, TCP, TFP
    this.tiempoProcesos = 0; // Tiempo usado por ráfagas de CPU
    this.tiempoOciosoCPU = 0; // Tiempo en que la CPU no hizo nada (Idle)
    this.tiempoTotalSimulacion = 0;

    this.log = [];
  }

  // Método principal para iniciar la simulación
  simular(procesos) {
    // 1. Inicialización de la simulación y reinicio de métricas
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

    // Inicializar rafagaCpuRestante
    this.simulacionProcesses.forEach(p => {
      p.rafagaCpuRestante = p.duracionRafagaCpu;
    });

    while (this.finishedProcesses.length < this.simulacionProcesses.length) {

      this.manejarProcesosBloqueados();
      this.manejarProcesosNuevos();

      // 2. Manejo de tiempo OCIOSO (Idle)
      if (this.readyQueue.length === 0) {
        const nextEventTime = this.calcularProximoEvento();

        if (nextEventTime !== Infinity && nextEventTime > this.currentTime) {
          // Si avanzamos el tiempo, la diferencia es tiempo ocioso
          this.tiempoOciosoCPU += nextEventTime - this.currentTime;
          this.currentTime = nextEventTime;

          // Re-chequear eventos que pudieron ocurrir en el salto
          this.manejarProcesosBloqueados();
          this.manejarProcesosNuevos();
        } else if (nextEventTime === Infinity) {
          break; // No hay más eventos.
        }

        if (this.readyQueue.length === 0) {
          continue; // Si sigue vacía, volvemos al inicio del bucle
        }
      }

      // 3. Selección del proceso a ejecutar
      const procesoActual = this.strategy.seleccionarProceso(this.readyQueue);
      if (procesoActual) {
        this.addLogEntry('SELECCION', procesoActual.nombre, `Seleccionado. Comienza TCP.`);
      }
      if (!procesoActual) {
        continue;
      }

      // Lógica para calcular tiempoEjecucion (preemption/quantum)
      let tiempoEjecucion;

      if (this.strategy.getName() === "Round Robin" && this.q > 0) {
        tiempoEjecucion = Math.min(procesoActual.rafagaCpuRestante, this.q);
      } else if (this.strategy.getName() === "SRTN" || this.strategy.getName() === "Prioridad Externa") {

        const proxArribo = this.simulacionProcesses
          .filter(p => p.estado === "NUEVO" && p.tiempoArribo > this.currentTime)
          .map(p => p.tiempoArribo)
          .reduce((min, t) => Math.min(min, t), Infinity);

        const proxIo = this.blockedQueue
          .map(p => p.finIo)
          .reduce((min, t) => Math.min(min, t), Infinity);

        let tiempoHastaProximoEvento = Math.min(proxArribo, proxIo) - this.currentTime;

        if (tiempoHastaProximoEvento <= 0) {
          tiempoHastaProximoEvento = procesoActual.rafagaCpuRestante;
        }

        tiempoEjecucion = Math.min(procesoActual.rafagaCpuRestante, tiempoHastaProximoEvento);

      } else { // FCFS, SPN, etc.
        tiempoEjecucion = procesoActual.rafagaCpuRestante;
      }

      // Acumulamos el Tiempo en estado Listo antes de la ejecución
      procesoActual.tiempoEnListo += this.currentTime - procesoActual.tiempoIngresoListo;

      // Se ejecuta el proceso
      this.ejecutarProceso(procesoActual, tiempoEjecucion);
    }

    this.tiempoTotalSimulacion = this.currentTime;
    const metricas = this.calcularMetricas(this.tiempoTotalSimulacion);

    return {
      schedule: this.schedule,
      totalTime: this.tiempoTotalSimulacion,
      metricas: metricas, // Devolvemos las métricas
      log: this.log,
    };
  }

  // Maneja la transición de NUEVO a LISTO (TIP)
  manejarProcesosNuevos() {
    // Usamos `findIndex` para encontrar y procesar todos los arribos en el tiempo actual
    let index;
    // La cola de `simulacionProcesses` solo contiene los procesos NUEVOS y TERMINADOS.
    while ((index = this.simulacionProcesses.findIndex(p => p.estado === 'NUEVO' && this.currentTime >= p.tiempoArribo)) !== -1) {
      const p = this.simulacionProcesses[index];

      // Simular TIP
      if (this.tip > 0) {
        this.schedule.push({
          process: p.nombre,
          start: this.currentTime,
          end: this.currentTime + this.tip,
          type: 'tip'
        });
        this.currentTime += this.tip;
        this.tiempoSO += this.tip;
      }

      // Transición a LISTO
      p.estado = 'LISTO';
      p.tiempoIngresoListo = this.currentTime;
      this.readyQueue.push(p);

      this.addLogEntry('LISTO', p.nombre, `Pasa a LISTO después de TIP.`);
    }
  }

  // Maneja la transición de BLOQUEADO a LISTO (NO CAMBIA)
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

  // Ejecuta el proceso y registra los tiempos de CPU y TCP
  ejecutarProceso(proceso, tiempoEjecucion) {
    // 1. Transición de LISTO a CORRIENDO (TCP)
    if (this.tcp > 0) {
      this.schedule.push({
        process: proceso.nombre,
        start: this.currentTime,
        end: this.currentTime + this.tcp,
        type: 'tcp'
      });
      this.currentTime += this.tcp;
      this.tiempoSO += this.tcp;
    }

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

    if (proceso.rafagaCpuRestante === 0) {
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

  // Maneja la transición de la CPU a BLOQUEADO (NO CAMBIA)
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
    if (this.tfp > 0) {
      this.schedule.push({
        process: proceso.nombre,
        start: this.currentTime,
        end: this.currentTime + this.tfp,
        type: 'tfp'
      });
      this.currentTime += this.tfp;
      this.tiempoSO += this.tfp;
    }
    proceso.estado = 'TERMINADO';
    proceso.tiempoFinalizacion = this.currentTime;
    this.finishedProcesses.push(proceso);
  }

  // Método para calcular y consolidar las métricas (NUEVO)
  calcularMetricas(totalTime) {
    const totalSimTime = totalTime;

    // 1. Métricas por Proceso
    const metricasPorProceso = this.finishedProcesses.map(p => {
      const tiempoRetorno = p.tiempoFinalizacion - p.tiempoArribo;
      const tiempoServicio = p.cantidadRafagasCpu * p.duracionRafagaCpu;

      // TR Normalizado (TRN) = TR / TS
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
  // Simulador.jsx: Método auxiliar
  addLogEntry(type, processName, description = '') {
    this.log.push({
      time: this.currentTime.toFixed(3),
      type: type, // Ej: 'ARRIBO', 'LISTO', 'CPU_START', 'TCP', 'FIN_IO', 'TERMINADO'
      process: processName,
      description: description,
    });
  }
}