export default class RoundRobin {
  constructor() {
    this.name = "Round Robin";
  }

  getName() {
    return this.name;
  }
  
  // En Round-Robin, la selección es FIFO (el primer proceso en la cola).
  seleccionarProceso(readyQueue) {
    if (readyQueue.length > 0) {
      // El simulador se encarga de que la cola de listos se mantenga ordenada.
      return readyQueue.shift();
    }
    return null;
  }
}