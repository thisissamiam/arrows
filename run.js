function runCode(){
  const code = window.editor.value;
  const startTime = performance.now();
  const maxExecutionTime = 30000;
  
  try{
    const result = interpret(code, startTime, maxExecutionTime);
    document.getElementById("output").textContent = result;
  } catch(e){
    document.getElementById("output").textContent = "Error: " + e.message;
  }
}

function interpret(code, startTime = 0, maxTime = 30000){
  // Use Map for sparse numeric variables
  const vars = new Map();
  let iterations = 0;

  function checkTimeout(){
    iterations++;
    if(iterations % 50000 === 0){
      if(performance.now() - startTime > maxTime){
        throw new Error("Execution timeout - program took too long");
      }
    }
  }

  // symbol table for 4 dots
  const symbols = [
    "!", "@", "#", "$", "%", "^", "&", "*", "(", ")",
    "-", "_", "=", "+", "[", "]", "{", "}", ";", ":",
    "'", "\"", ",", "<", ">", ".", "/", "?", "\\", "|", "`", "~"
  ];

  function runBlock(codeSlice){
    const parts = [];
    let idx = 0;

    while(idx < codeSlice.length){
      checkTimeout();

      const ch = codeSlice[idx];

      // skip whitespace
      if(/\s/.test(ch)){
        idx++;
        continue;
      }

      if(ch === ">"){
        // read arrows
        let arrows = 0;
        while(idx < codeSlice.length && codeSlice[idx] === ">"){
          arrows++;
          idx++;
        }

        // LOOP
        if(idx < codeSlice.length && codeSlice[idx] === "["){
          idx++; // skip '['
          const bodyStart = idx;
          let depth = 1;
          while(idx < codeSlice.length && depth > 0){
            if(codeSlice[idx] === "[") depth++;
            else if(codeSlice[idx] === "]") depth--;
            idx++;
          }
          const bodyEnd = idx - 1;
          const body = codeSlice.substring(bodyStart, bodyEnd);

          for(let j = 0; j < arrows; j++){
            checkTimeout();
            parts.push(runBlock(body).join(""));
          }
        }

        // PRINT
        else if(idx < codeSlice.length && codeSlice[idx] === "."){
          let dots = 0;
          while(idx < codeSlice.length && codeSlice[idx] === "."){
            dots++;
            idx++;
          }

          if(dots === 1){
            parts.push(String.fromCharCode(96 + arrows)); // lowercase
          } else if(dots === 2){
            parts.push(String.fromCharCode(64 + arrows)); // uppercase
          } else if(dots === 3){
            parts.push(String(arrows)); // numeric
          } else if(dots === 4){
            // symbols mapping
            const sym = symbols[(arrows - 1) % symbols.length];
            parts.push(sym);
          } else {
            // Helpful inline message instead of a single "?"
            parts.push(`[Invalid print: arrows=${arrows} dots=${dots}]`);
          }
        }

        // VAR PRINT (->)
        else if(idx + 1 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === ">"){
          idx += 2;
          parts.push(String(vars.get(arrows) || 0));
        }

        // ASSIGN (-=>)
        else if(idx + 2 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === "=" && codeSlice[idx + 2] === ">"){
          idx += 3;
          let value = 0;
          while(idx < codeSlice.length && codeSlice[idx] === "."){
            value++;
            idx++;
          }
          vars.set(arrows, value);
        }

        else {
          // fallback: skip unknown sequence
          idx++;
        }
      } else {
        idx++;
      }
    }

    return parts;
  }

  return runBlock(code).join("");
}
