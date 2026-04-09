let inputCounter = 0;
const pendingInputs = new Map();

self.onmessage = async function(e){
  try {
    const data = e.data;

    if (data && data.type === 'input-response') {
      const resolver = pendingInputs.get(data.id);
      if (resolver) {
        resolver(data.value);
        pendingInputs.delete(data.id);
      }
      return;
    }

    const code = typeof data === 'string' ? data : String(data || "");
    const result = await interpret(code);

    self.postMessage({ type: 'result', result });

  } catch (err) {
    const msg = err?.message || String(err);
    self.postMessage({ type: 'error', message: msg });
  }
};

function requestInput(promptText) {
  const id = ++inputCounter;
  const p = new Promise(resolve => pendingInputs.set(id, resolve));
  self.postMessage({ type: 'input-request', id, prompt: promptText || "" });
  return p;
}

// --- interpreter stays the same ---
async function interpret(code) {
  const vars = new Map();

  const symbols = [
    "!", "@", "#", "$", "%", "^", "&", "*", "(", ")",
    "-", "_", "=", "+", "[", "]", "{", "}", ";", ":",
    "'", "\"", ",", "<", ">", ".", "/", "?", "\\", "|", "`", "~"
  ];

  async function runBlock(codeSlice, baseOffset){
    const parts = [];
    let idx = 0;

    while (idx < codeSlice.length) {
      const ch = codeSlice[idx];

      if (/\s/.test(ch)) {
        idx++;
        continue;
      }

      if (ch === ">") {
        let arrows = 0;
        while (idx < codeSlice.length && codeSlice[idx] === ">") { arrows++; idx++; }

        if (idx < codeSlice.length && codeSlice[idx] === "[") {
          idx++;
          const bodyStart = idx;
          let depth = 1;

          while (idx < codeSlice.length && depth > 0) {
            if (codeSlice[idx] === "[") depth++;
            else if (codeSlice[idx] === "]") depth--;
            idx++;
          }

          const bodyEnd = idx - 1;
          const body = codeSlice.substring(bodyStart, bodyEnd);

          const sub = await runBlock(body, baseOffset + bodyStart);
          const subJoined = sub.join("");

          for (let j = 0; j < arrows; j++) parts.push(subJoined);
        }

        else if (idx < codeSlice.length && codeSlice[idx] === ".") {
          let dots = 0;
          while (idx < codeSlice.length && codeSlice[idx] === ".") { dots++; idx++; }

          if (dots === 1) parts.push(String.fromCharCode(96 + arrows));
          else if (dots === 2) parts.push(String.fromCharCode(64 + arrows));
          else if (dots === 3) parts.push(String(arrows));
          else if (dots === 4) {
            const symbolsArr = symbols;
            const sym = symbolsArr[(arrows - 1) % symbolsArr.length];
            parts.push(sym);
          }
          else {
            throw new Error(`Too many dots at index ${baseOffset}`);
          }
        }

        else if (idx + 1 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === ">") {
          idx += 2;
          const v = vars.has(arrows) ? vars.get(arrows) : 0;
          parts.push(String(v));
        }

        else {
          idx++;
        }
      } else {
        idx++;
      }
    }

    return parts;
  }

  const outParts = await runBlock(code, 0);
  return outParts.join("");
}
