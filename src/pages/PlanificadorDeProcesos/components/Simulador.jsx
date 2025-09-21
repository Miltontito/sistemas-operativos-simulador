export class Simulador {
  constructor(procesosIniciales, estrategia) {
    this.procesos = JSON.parse(JSON.stringify(procesosIniciales));
    this.estrategia = estrategia;
    this.schedule = [];
    this.totalTime = 0;
    this.metricas = {};
  }

  setEstrategia(nuevaEstrategia) {
    this.estrategia = nuevaEstrategia;
  }

  run() {
    const { schedule, totalTime } = this.estrategia.simular(this.procesos);
    
    // Almacenamos el resultado de la simulación
    this.schedule = schedule;
    this.totalTime = totalTime;
    
    return {
      schedule: this.schedule,
      totalTime: this.totalTime,
      processes: this.procesos.map(p => p.nombre)
    };
  }
}