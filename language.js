window.grammar = {
  Lexer: undefined,
  ParserRules: [

    // entry
    { name: "main", symbols: ["_", "statements", "_"], postprocess: d => d[1] },

    // statements list
    { name: "statements", symbols: ["statement"], postprocess: d => [d[0]] },
    { name: "statements", symbols: ["statements", "_", "statement"], postprocess: d => [...d[0], d[2]] },

    // statements
    { name: "statement", symbols: ["loop"], postprocess: d => d[0] },
    { name: "statement", symbols: ["assign"], postprocess: d => d[0] },
    { name: "statement", symbols: ["varPrint"], postprocess: d => d[0] },
    { name: "statement", symbols: ["print"], postprocess: d => d[0] },

    // LOOP: >>>[ ... ]
    { name: "loop", symbols: ["arrows", "[", "statements", "]"],
      postprocess: d => ({ type: "loop", count: d[0], body: d[2] }) },

    // ASSIGN: >>-=>..
    { name: "assign", symbols: ["arrows", "-=>", "value"],
      postprocess: d => ({ type: "assign", varIndex: d[0], value: d[2] }) },

    // VAR PRINT: >>->
    { name: "varPrint", symbols: ["arrows", "->"],
      postprocess: d => ({ type: "varPrint", varIndex: d[0] }) },

    // PRINT: >>>..
    { name: "print", symbols: ["arrows", "dots"],
      postprocess: d => ({ type: "print", arrows: d[0], dots: d[1] }) },

    // arrows count >
    { name: "arrows", symbols: [">"], postprocess: () => 1 },
    { name: "arrows", symbols: [">", "arrows"], postprocess: d => d[1] + 1 },

    // dots count .
    { name: "dots", symbols: ["."], postprocess: () => 1 },
    { name: "dots", symbols: [".", "dots"], postprocess: d => d[1] + 1 },

    // values (reuse dots)
    { name: "value", symbols: ["dots"], postprocess: d => d[0] },

    // whitespace (ignored)
    { name: "_", symbols: [], postprocess: () => null },
    { name: "_", symbols: [/[ \t\n\r]+/], postprocess: () => null }

  ],
  ParserStart: "main"
};
