export default class FCFS {
  constructor() {
    this.name = "FCFS";
  }

  getName() {
    return this.name;
  }
  
  // La lógica de FCFS se reduce a seleccionar el proceso más antiguo en la cola.
  seleccionarProceso(readyQueue) {
    if (readyQueue.length > 0) {
      // Ordenamos por tiempo de llegada a la cola de listos (el más antiguo primero)
      readyQueue.sort((a, b) => a.tiempoIngresoListo - b.tiempoIngresoListo);
      return readyQueue.shift();
    }
    return null;
  }
}