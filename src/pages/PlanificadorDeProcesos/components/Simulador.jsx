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
  }

  // Método principal para iniciar la simulación
  simular(procesos) {
    this.simulacionProcesses = procesos.map(p => new Proceso(p));
    this.simulacionProcesses.sort((a, b) => a.tiempoArribo - b.tiempoArribo);

    // Inicializamos la propiedad para el tiempo de ráfaga restante
    this.simulacionProcesses.forEach(p => {
      p.rafagaCpuRestante = p.duracionRafagaCpu;
    });

    while (this.finishedProcesses.length < this.simulacionProcesses.length) {

      this.avanzarTiempo();
      this.manejarProcesosNuevos();
      this.manejarProcesosBloqueados();

      // Si no hay procesos listos, avanzamos al próximo evento y continuamos
      if (this.readyQueue.length === 0) {
        const nextEventTime = this.calcularProximoEvento();
        if (nextEventTime !== Infinity) {
          this.currentTime = nextEventTime;
        }
        continue;
      }

      // La estrategia de planificación selecciona el próximo proceso
      const procesoActual = this.strategy.seleccionarProceso(this.readyQueue);
      if (!procesoActual) {
        continue;
      }

      // La lógica para la preemption se maneja antes de la ejecución
      let tiempoEjecucion;

      if (this.strategy.getName() === "Round Robin" && this.q > 0) {
        tiempoEjecucion = Math.min(procesoActual.rafagaCpuRestante, this.q);
      } else if (this.strategy.getName() === "SRTN" || this.strategy.getName() === "Prioridad Externa") {
        // Para SRTN y Prioridad Externa, el tiempo de ejecución es hasta que llegue el próximo evento
        const proxArribo = this.simulacionProcesses
          .filter(p => p.estado === "NUEVO")
          .map(p => p.tiempoArribo)[0] || Infinity;

        const proxIo = this.blockedQueue
          .map(p => p.finIo)[0] || Infinity;

        // El tiempo de ejecución es el mínimo entre la ráfaga restante y el tiempo hasta el próximo evento
        const tiempoHastaProximoEvento = Math.min(
          proxArribo - this.currentTime,
          proxIo - this.currentTime
        );

        if (tiempoHastaProximoEvento > 0) {
          tiempoEjecucion = Math.min(procesoActual.rafagaCpuRestante, tiempoHastaProximoEvento);
        } else {
          tiempoEjecucion = procesoActual.rafagaCpuRestante;
        }

      } else { // FCFS, SPN, etc.
        tiempoEjecucion = procesoActual.rafagaCpuRestante;
      }

      // Se ejecuta el proceso por el tiempo de ejecución calculado
      this.ejecutarProceso(procesoActual, tiempoEjecucion);
    }

    return {
      schedule: this.schedule,
      totalTime: this.currentTime,
    };
  }

  // Avanza el tiempo. Esto puede ser un avance de un solo tick o un salto a un evento futuro.
  avanzarTiempo() {
    // Si no hay procesos en ninguna cola, avanzamos hasta el próximo arribo.
    if (this.readyQueue.length === 0 && this.blockedQueue.length === 0) {
      const nextArribo = this.simulacionProcesses.find(p => p.estado === 'NUEVO')?.tiempoArribo;
      if (nextArribo && nextArribo > this.currentTime) {
        this.currentTime = nextArribo;
      }
    }
  }

  // Maneja la transición de NUEVO a LISTO (TIP)
  manejarProcesosNuevos() {
    for (const p of this.simulacionProcesses) {
      if (p.estado === 'NUEVO' && this.currentTime >= p.tiempoArribo) {
        if (this.tip > 0) {
          this.schedule.push({
            process: p.nombre,
            start: this.currentTime,
            end: this.currentTime + this.tip,
            type: 'tip'
          });
          this.currentTime += this.tip;
        }
        p.estado = 'LISTO';
        p.tiempoIngresoListo = this.currentTime;
        this.readyQueue.push(p);
      }
    }
  }

  // Maneja la transición de BLOQUEADO a LISTO
  manejarProcesosBloqueados() {
    const processesReadyNow = this.blockedQueue.filter(p => this.currentTime >= p.finIo);
    for (const p of processesReadyNow) {
      p.estado = 'LISTO';
      p.tiempoIngresoListo = this.currentTime;
      this.readyQueue.push(p);
    }
    this.blockedQueue = this.blockedQueue.filter(p => this.currentTime < p.finIo);
  }

  // Calcula el tiempo del próximo evento (arribo o fin de I/O) para evitar ciclos infinitos
  calcularProximoEvento() {
    const proxArribo = this.simulacionProcesses
      .filter(p => p.estado === "NUEVO")
      .map(p => p.tiempoArribo);

    const proxIo = this.blockedQueue.map(p => p.finIo);

    return Math.min(...proxArribo, ...proxIo, Infinity);
  }

  // Este método ahora recibe el tiempo de ejecución como parámetro
  ejecutarProceso(proceso, tiempoEjecucion) {
    // Transición de LISTO a CORRIENDO (TCP)
    if (this.tcp > 0) {
      this.schedule.push({
        process: proceso.nombre,
        start: this.currentTime,
        end: this.currentTime + this.tcp,
        type: 'tcp'
      });
      this.currentTime += this.tcp;
    }

    // Ejecución de la ráfaga de CPU
    const startCpu = this.currentTime;
    const endCpu = startCpu + tiempoEjecucion;
    this.schedule.push({
      process: proceso.nombre,
      start: startCpu,
      end: endCpu,
      type: 'cpu'
    });
    this.currentTime = endCpu;

    // Actualizamos el tiempo de ráfaga restante
    proceso.rafagaCpuRestante -= tiempoEjecucion;

    // Transición según el resultado de la ejecución
    if (proceso.rafagaCpuRestante === 0) {
      // Si la ráfaga completa ha terminado
      proceso.rafagasRestantes--;

      // Reiniciamos el tiempo de ráfaga restante para la próxima ráfaga
      proceso.rafagaCpuRestante = proceso.duracionRafagaCpu;

      if (proceso.rafagasRestantes === 0) {
        this.finalizarProceso(proceso);
      } else {
        this.bloquearProceso(proceso);
      }
    } else {
      // Si la ráfaga no ha terminado (se agotó el quantum o fue apropiado)
      proceso.estado = 'LISTO';
      proceso.tiempoIngresoListo = this.currentTime;
      this.readyQueue.push(proceso); // Vuelve al final de la cola de listos
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
    if (this.tfp > 0) {
      this.schedule.push({
        process: proceso.nombre,
        start: this.currentTime,
        end: this.currentTime + this.tfp,
        type: 'tfp'
      });
      this.currentTime += this.tfp;
    }
    proceso.estado = 'TERMINADO';
    this.finishedProcesses.push(proceso);
  }
}