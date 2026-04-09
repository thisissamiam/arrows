window.addEventListener("DOMContentLoaded", () => {

  let worker = null;

  const runBtn = document.getElementById('runBtn');
  const stopBtn = document.getElementById('stopBtn');
  const outputEl = document.getElementById('output');

  function clearWorker() {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  }

  window.runCode = function runCode(){
    try {
      clearWorker();
      outputEl.textContent = "";

      worker = new Worker('worker.js');

      worker.onmessage = function(e){
        try {
          const data = e.data;
          if (!data) return;

          if (data.type === 'result') {
            outputEl.textContent = String(data.result);
            clearWorker();
          } else if (data.type === 'error') {
            alert("Interpreter Error:\n" + data.message);
            outputEl.textContent = "Error: " + data.message;
            clearWorker();
          } else if (data.type === 'input-request') {
            const value = prompt(data.prompt || "Input:");
            worker.postMessage({ type: 'input-response', id: data.id, value });
          } else if (typeof data === 'string') {
            outputEl.textContent = data;
            clearWorker();
          }
        } catch (err) {
          alert("UI Error:\n" + err.message);
        }
      };

      worker.onerror = function(ev){
        const msg = ev.message || ev.error?.message || "Worker error";
        alert("Worker Error:\n" + msg);
        outputEl.textContent = "Error: " + msg;
        clearWorker();
      };

      const code = document.getElementById("editor").value;
      worker.postMessage(code);

    } catch (err) {
      alert("Run Error:\n" + err.message);
      outputEl.textContent = "Error: " + err.message;
    }
  };

  runBtn.addEventListener('click', window.runCode);

  stopBtn.addEventListener('click', () => {
    if(worker){
      worker.terminate();
      worker = null;
      outputEl.textContent = "Execution terminated.";
    }
  });

});
