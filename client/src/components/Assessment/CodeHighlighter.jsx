import React from "react";

// ─── Token colour palette (dark-theme optimised) ─────────────────────────────
const COLORS = {
    keyword: "#c792ea", // purple  — module, always, if, for, input, etc.
    type: "#ffcb6b", // amber   — reg, wire, integer, logic, bit, etc.
    number: "#f78c6c", // orange  — 8'b1010, 0xFF, 3.14, etc.
    string: "#c3e88d", // green   — "hello", 'x'
    comment: "#546e7a", // muted   — // ... and /* ... */
    operator: "#89ddff", // cyan    — = , ; + - & | ~ ^ @ # ! ? :
    preproc: "#f07178", // rose    — `define, `include, #include, @
    builtin: "#82aaff", // blue    — $display, $finish, printf, std
    port: "#7dd3fc", // sky     — identifiers that look like ports/signals
    plain: "#e4e4e7", // default white-ish text
};

// ─── Token rules — ORDER MATTERS (first match wins) ──────────────────────────
const TOKEN_RULES = [
    // 1. Block comments  /* … */
    { type: "comment", re: /\/\*[\s\S]*?\*\//g },
    // 2. Line comments   // …   or  # …(python)
    { type: "comment", re: /(\/\/|#(?!\s*include\b|define\b)).*$/gm },
    // 3. Strings  "…"  '…'  (single char)
    { type: "string", re: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g },
    // 4. Preprocessor / compiler directives  `…   #include  #define
    { type: "preproc", re: /`\w+|#\s*(?:include|define|ifndef|ifdef|endif|pragma)\b[^\n]*/g },
    // 5. System tasks / builtins   $display  $finish  printf  std::
    { type: "builtin", re: /\$\w+|\bstd::\w+|\bprintf\b|\bsprintf\b|\bfprintf\b|\bscanf\b/g },
    // 6. Verilog / SV / C / Python keywords
    {
        type: "keyword",
        re: /\b(module|endmodule|input|output|inout|parameter|localparam|generate|endgenerate|genvar|always|always_ff|always_comb|always_latch|initial|begin|end|if|else|case|casex|casez|endcase|for|foreach|while|do|repeat|forever|fork|join|join_any|join_none|assign|force|release|deassign|default|posedge|negedge|edge|wire|reg|logic|bit|byte|shortint|int|longint|integer|real|realtime|time|string|enum|struct|union|typedef|class|endclass|extends|implements|function|endfunction|task|endtask|return|import|export|package|endpackage|interface|endinterface|modport|clocking|endclocking|program|endprogram|property|endproperty|sequence|endsequence|assert|assume|cover|restrict|disable|iff|within|throughout|intersect|first_match|and|or|not|nand|nor|xor|xnor|buf|bufif0|bufif1|notif0|notif1|pullup|pulldown|supply0|supply1|tri|tri0|tri1|triand|trior|trireg|wand|wor|tran|tranif0|tranif1|release|def|class|pass|lambda|with|as|from|raise|try|except|finally|yield|async|await|global|nonlocal|del|is|in|not|and|or|True|False|None|void|auto|static|extern|const|volatile|unsigned|signed|short|long|char|float|double|struct|union|enum|typedef|sizeof|break|continue|goto|switch|include|define|ifdef|ifndef|endif|pragma|inline|register)\b/g,
    },
    // 7. Data-type-like tokens (Verilog widths, logic types)
    {
        type: "type",
        re: /\b(\d+'[bBoOdDhH]\w+)\b/g,   // 8'b1010  4'hF  etc.
    },
    // 8. Numeric literals  0x…  0b…  floats  integers
    { type: "number", re: /\b(0[xXbBoO][\da-fA-F_]+|\d+\.\d*(?:[eE][+-]?\d+)?|\d+)\b/g },
    // 9. Operators & punctuation
    { type: "operator", re: /[=<>!&|^~+\-*/%?:;,@#()[\]{}]/g },
];

// ─── Tokeniser ────────────────────────────────────────────────────────────────
/**
 * Splits `code` into an array of { text, type } tokens.
 * Overlapping / already-claimed ranges are skipped.
 */
function tokenise(code) {
    // Collect all raw matches with their range and type
    const matches = [];
    for (const rule of TOKEN_RULES) {
        rule.re.lastIndex = 0; // reset stateful regex
        let m;
        while ((m = rule.re.exec(code)) !== null) {
            matches.push({ start: m.index, end: m.index + m[0].length, type: rule.type, text: m[0] });
        }
    }

    // Sort by start position; if tie, longer match first
    matches.sort((a, b) => a.start - b.start || b.end - a.end);

    // Build token list, skipping overlapping matches
    const tokens = [];
    let cursor = 0;
    for (const m of matches) {
        if (m.start < cursor) continue; // already consumed
        if (m.start > cursor) {
            // plain text gap
            tokens.push({ text: code.slice(cursor, m.start), type: "plain" });
        }
        tokens.push({ text: m.text, type: m.type });
        cursor = m.end;
    }
    if (cursor < code.length) {
        tokens.push({ text: code.slice(cursor), type: "plain" });
    }
    return tokens;
}

// ─── React component ──────────────────────────────────────────────────────────
const CodeHighlighter = ({ code }) => {
    if (!code) return null;

    const tokens = tokenise(code);

    return (
        <pre
            style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                fontSize: "0.85rem",
                lineHeight: 1.75,
                background: "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(10,10,20,0.7))",
                border: "1px solid rgba(0,245,255,0.12)",
                borderLeft: "3px solid rgba(0,245,255,0.4)",
                borderRadius: "10px",
                padding: "1rem",
                marginTop: "0.85rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowX: "hidden",
                tabSize: 2,
                boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                position: "relative",
            }}
            aria-label="Code snippet"
        >
            {/* Language badge */}
            <span
                style={{
                    position: "absolute",
                    top: "0.45rem",
                    right: "0.75rem",
                    fontSize: "0.65rem",
                    fontFamily: "sans-serif",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(0,245,255,0.35)",
                    userSelect: "none",
                }}
            >
                code
            </span>

            {tokens.map((tok, i) => (
                <span key={i} style={{ color: COLORS[tok.type] ?? COLORS.plain }}>
                    {tok.text}
                </span>
            ))}
        </pre>
    );
};

export default CodeHighlighter;
