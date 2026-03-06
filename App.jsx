import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#f0f4ff",
  surface: "#ffffff",
  card: "#f8f9ff",
  accent: "#5b21b6",
  accent2: "#0369a1",
  accent3: "#b45309",
  text: "#1e1b4b",
  muted: "#6b7280",
  positive: "#047857",
  negative: "#be123c",
  border: "#dde1f0",
};

function parseNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function solveQuadratic(a, b, c) {
  if (a === 0) return null;
  const disc = b * b - 4 * a * c;
  const vertex = { x: -b / (2 * a), y: c - (b * b) / (4 * a) };
  const axisOfSymmetry = -b / (2 * a);
  const yIntercept = c;
  const discriminant = disc;

  let roots = [];
  let rootType = "";
  if (disc > 0) {
    rootType = "two real roots";
    roots = [(-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a)];
  } else if (disc === 0) {
    rootType = "one real root (repeated)";
    roots = [-b / (2 * a)];
  } else {
    rootType = "two complex roots";
    const real = -b / (2 * a);
    const imag = Math.sqrt(-disc) / (2 * a);
    roots = [`${fmt(real)} + ${fmt(imag)}i`, `${fmt(real)} − ${fmt(imag)}i`];
  }

  return { vertex, axisOfSymmetry, yIntercept, discriminant, roots, rootType, disc };
}

function fmt(n, dp = 4) {
  if (typeof n === "string") return n;
  const rounded = Math.round(n * 10000) / 10000;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(dp).replace(/\.?0+$/, "");
}

function QuadGraph({ a, b, c, solution }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#f8f9ff";
    ctx.fillRect(0, 0, W, H);

    if (!solution) return;

    const vx = solution.vertex.x;
    const vy = solution.vertex.y;

    // Determine range
    let xMin = vx - 5, xMax = vx + 5;
    if (solution.disc >= 0) {
      const span = Math.abs(solution.roots[0] - (solution.roots[1] ?? solution.roots[0]));
      xMin = Math.min(vx - Math.max(span, 4) * 0.8, vx - 4);
      xMax = Math.max(vx + Math.max(span, 4) * 0.8, vx + 4);
    }

    const yVals = [];
    for (let px = 0; px < W; px++) {
      const x = xMin + (px / W) * (xMax - xMin);
      yVals.push(a * x * x + b * x + c);
    }
    const yMin = Math.min(...yVals, vy) - 2;
    const yMax = Math.max(...yVals, vy) + 2;

    const toCanvas = (x, y) => ({
      cx: ((x - xMin) / (xMax - xMin)) * W,
      cy: H - ((y - yMin) / (yMax - yMin)) * H,
    });

    // Grid
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const { cx } = toCanvas(x, 0);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, H);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      const { cy } = toCanvas(0, y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(W, cy);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 2;
    const { cy: zeroY } = toCanvas(0, 0);
    const { cx: zeroX } = toCanvas(0, 0);
    ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(W, zeroY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zeroX, 0); ctx.lineTo(zeroX, H); ctx.stroke();

    // Axis labels
    ctx.fillStyle = COLORS.muted;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x === 0) continue;
      const { cx, cy: ay } = toCanvas(x, 0);
      ctx.fillText(x, cx, Math.min(ay + 15, H - 4));
    }
    ctx.textAlign = "right";
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      if (y === 0) continue;
      const { cx: ax, cy } = toCanvas(0, y);
      ctx.fillText(y, Math.max(ax - 4, 20), cy + 4);
    }

    // Axis of symmetry
    const { cx: asx } = toCanvas(vx, 0);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = COLORS.accent3 + "88";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(asx, 0); ctx.lineTo(asx, H); ctx.stroke();
    ctx.setLineDash([]);

    // Parabola
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, COLORS.accent);
    grad.addColorStop(0.5, COLORS.accent2);
    grad.addColorStop(1, COLORS.accent);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.accent2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px < W; px++) {
      const x = xMin + (px / W) * (xMax - xMin);
      const y = a * x * x + b * x + c;
      const { cx, cy } = toCanvas(x, y);
      if (first) { ctx.moveTo(cx, cy); first = false; } else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Roots
    if (solution.disc >= 0) {
      solution.roots.forEach((r) => {
        if (typeof r !== "number") return;
        const { cx, cy } = toCanvas(r, 0);
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.negative;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = COLORS.text;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`x=${fmt(r, 2)}`, cx, cy - 12);
      });
    }

    // Vertex
    const { cx: vcx, cy: vcy } = toCanvas(vx, vy);
    ctx.beginPath();
    ctx.arc(vcx, vcy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#d97706";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = vy >= 0 ? "center" : "center";
    ctx.fillText(`(${fmt(vx, 2)}, ${fmt(vy, 2)})`, vcx, vcy + (a > 0 ? -14 : 14));

    // Y-intercept
    if (c >= yMin && c <= yMax) {
      const { cx: yicx, cy: yicy } = toCanvas(0, c);
      ctx.beginPath();
      ctx.arc(yicx, yicy, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.positive;
      ctx.fill();
    }
  }, [a, b, c, solution]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={340}
      style={{ borderRadius: 12, width: "100%", maxWidth: 560, display: "block" }}
    />
  );
}

function InfoCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: "14px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <span style={{ color: COLORS.muted, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace" }}>{label}</span>
      <span style={{ color: color || COLORS.text, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>{value}</span>
      {sub && <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: "monospace" }}>{sub}</span>}
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ color: COLORS.muted, fontSize: 12, fontFamily: "monospace", letterSpacing: "0.06em" }}>
        {label} = <span style={{ color: COLORS.accent2, fontWeight: 700 }}>{value}</span>
      </label>
      <input
        type="range" min="-10" max="10" step="0.5" value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ accentColor: COLORS.accent, width: "100%", cursor: "pointer" }}
      />
    </div>
  );
}

export default function App() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-3);
  const [c, setC] = useState(2);
  const [inputMode, setInputMode] = useState("slider"); // slider | text

  const [ta, setTa] = useState("1");
  const [tb, setTb] = useState("-3");
  const [tc, setTc] = useState("2");

  const av = inputMode === "slider" ? a : parseNum(ta);
  const bv = inputMode === "slider" ? b : parseNum(tb);
  const cv = inputMode === "slider" ? c : parseNum(tc);

  const solution = solveQuadratic(av, bv, cv);

  const eqStr = () => {
    const parts = [];
    if (av !== 0) parts.push(`${av === 1 ? "" : av === -1 ? "-" : av}x²`);
    if (bv !== 0) parts.push(`${bv > 0 ? "+" : ""}${bv === 1 ? "" : bv === -1 ? "-" : bv}x`);
    if (cv !== 0 || parts.length === 0) parts.push(`${cv > 0 && parts.length ? "+" : ""}${cv}`);
    return `f(x) = ${parts.join(" ") || "0"}`;
  };

  const factored = () => {
    if (!solution || solution.disc < 0 || av === 0) return null;
    if (solution.disc === 0) {
      return `${av !== 1 ? av : ""}(x − ${fmt(solution.roots[0])})²`;
    }
    const r1 = solution.roots[0], r2 = solution.roots[1];
    const s1 = r1 < 0 ? `+ ${fmt(-r1)}` : `− ${fmt(r1)}`;
    const s2 = r2 < 0 ? `+ ${fmt(-r2)}` : `− ${fmt(r2)}`;
    return `${av !== 1 ? av : ""}(x ${s1})(x ${s2})`;
  };

  const vertexForm = () => {
    if (!solution) return null;
    const h = solution.vertex.x, k = solution.vertex.y;
    const hs = h < 0 ? `+ ${fmt(-h)}` : `− ${fmt(h)}`;
    return `${av !== 1 ? av : ""}(x ${hs})² ${k >= 0 ? "+ " : "− "}${fmt(Math.abs(k))}`;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      padding: "32px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: #dde1f0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #5b21b6; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(91,33,182,0.3); }
        input[type=number], input[type=text] {
          background: #f8f9ff; border: 1px solid #dde1f0; border-radius: 8px;
          color: #1e1b4b; padding: 8px 12px; font-size: 16px; font-family: 'IBM Plex Mono', monospace;
          width: 100%; outline: none; transition: border-color 0.2s;
        }
        input[type=number]:focus, input[type=text]:focus { border-color: #5b21b6; }
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            borderRadius: 8, padding: "4px 14px", fontSize: 11, letterSpacing: "0.12em",
            color: "#fff", marginBottom: 12, textTransform: "uppercase", fontWeight: 700,
          }}>Quadratic Solver</div>
          <div style={{
            fontSize: 28, fontWeight: 700,
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>ax² + bx + c = 0</div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center" }}>
          {["slider", "text"].map(m => (
            <button key={m} onClick={() => setInputMode(m)} style={{
              padding: "6px 18px", borderRadius: 8, border: "1px solid",
              borderColor: inputMode === m ? COLORS.accent : COLORS.border,
              background: inputMode === m ? COLORS.accent + "30" : "transparent",
              color: inputMode === m ? COLORS.accent2 : COLORS.muted,
              cursor: "pointer", fontFamily: "monospace", fontSize: 13, fontWeight: 600,
              transition: "all 0.2s",
            }}>{m === "slider" ? "🎚 Sliders" : "✏️ Type Values"}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 20,
        }}>
          {inputMode === "slider" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Slider label="a" value={a} onChange={setA} />
              <Slider label="b" value={b} onChange={setB} />
              <Slider label="c" value={c} onChange={setC} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[["a", ta, setTa], ["b", tb, setTb], ["c", tc, setTc]].map(([label, val, set]) => (
                <div key={label}>
                  <label style={{ color: COLORS.muted, fontSize: 12, display: "block", marginBottom: 4 }}>{label}</label>
                  <input type="number" value={val} onChange={e => set(e.target.value)} step="any" />
                </div>
              ))}
            </div>
          )}
          <div style={{
            marginTop: 16, padding: "10px 16px",
            background: COLORS.card, borderRadius: 8,
            color: COLORS.accent2, fontWeight: 700, fontSize: 16, textAlign: "center",
            letterSpacing: "0.03em",
          }}>{eqStr()}</div>
        </div>

        {/* Graph */}
        <div style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14, padding: 16, marginBottom: 20,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: COLORS.muted, flexWrap: "wrap", justifyContent: "center" }}>
            <span><span style={{ color: COLORS.negative }}>●</span> Roots</span>
            <span><span style={{ color: COLORS.accent3 }}>●</span> Vertex</span>
            <span><span style={{ color: COLORS.positive }}>●</span> Y-intercept</span>
            <span><span style={{ color: COLORS.accent3 + "88", fontStyle: "italic" }}>- -</span> Axis of symmetry</span>
          </div>
          <QuadGraph a={av} b={bv} c={cv} solution={solution} />
        </div>

        {/* Results Grid */}
        {solution && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <InfoCard
              label="Discriminant (Δ)"
              value={fmt(solution.discriminant)}
              sub={solution.discriminant > 0 ? "Δ > 0" : solution.discriminant === 0 ? "Δ = 0" : "Δ < 0"}
              color={solution.discriminant > 0 ? COLORS.positive : solution.discriminant === 0 ? COLORS.accent3 : COLORS.negative}
            />
            <InfoCard
              label="Root Type"
              value={solution.rootType}
              color={COLORS.accent2}
            />
            <InfoCard
              label="Vertex"
              value={`(${fmt(solution.vertex.x)}, ${fmt(solution.vertex.y)})`}
              sub={av > 0 ? "Minimum point" : "Maximum point"}
              color={COLORS.accent3}
            />
            <InfoCard
              label="Axis of Symmetry"
              value={`x = ${fmt(solution.axisOfSymmetry)}`}
              color={COLORS.accent3}
            />
            <InfoCard
              label="Y-Intercept"
              value={`(0, ${fmt(solution.yIntercept)})`}
              color={COLORS.positive}
            />
            <InfoCard
              label="Opens"
              value={av > 0 ? "Upward ∪" : av < 0 ? "Downward ∩" : "—"}
              sub={av > 0 ? "Positive leading coeff." : "Negative leading coeff."}
              color={av > 0 ? COLORS.positive : COLORS.negative}
            />
          </div>
        )}

        {/* Roots */}
        {solution && (
          <div style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14, padding: "16px 20px", marginBottom: 16,
          }}>
            <div style={{ color: COLORS.muted, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Roots / x-intercepts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {solution.roots.map((r, i) => (
                <div key={i} style={{
                  background: COLORS.card, borderRadius: 8, padding: "10px 14px",
                  color: solution.disc < 0 ? COLORS.muted : COLORS.negative,
                  fontWeight: 700, fontSize: 15, display: "flex", justifyContent: "space-between"
                }}>
                  <span>x{solution.roots.length > 1 ? (i === 0 ? "₁" : "₂") : ""}</span>
                  <span>{typeof r === "number" ? fmt(r) : r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternate Forms */}
        {solution && (
          <div style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14, padding: "16px 20px", marginBottom: 16,
          }}>
            <div style={{ color: COLORS.muted, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Alternate Forms</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: COLORS.card, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 2 }}>Standard Form</div>
                <div style={{ color: COLORS.text, fontWeight: 600 }}>{eqStr()}</div>
              </div>
              <div style={{ background: COLORS.card, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 2 }}>Vertex Form</div>
                <div style={{ color: COLORS.text, fontWeight: 600 }}>f(x) = {vertexForm()}</div>
              </div>
              {solution.disc >= 0 && (
                <div style={{ background: COLORS.card, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 2 }}>Factored Form</div>
                  <div style={{ color: COLORS.text, fontWeight: 600 }}>f(x) = {factored()}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quadratic Formula */}
        {solution && (
          <div style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14, padding: "16px 20px",
          }}>
            <div style={{ color: COLORS.muted, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Quadratic Formula Substituted</div>
            <div style={{
              background: COLORS.card, borderRadius: 8, padding: "12px 14px",
              color: COLORS.accent2, fontSize: 14, lineHeight: 1.8,
            }}>
              <div>x = (−b ± √(b²−4ac)) / 2a</div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>
                x = (−({bv}) ± √(({bv})²−4·{av}·{cv})) / 2·{av}
              </div>
              <div style={{ color: COLORS.text, fontWeight: 600, fontSize: 13 }}>
                x = ({-bv} ± √({fmt(solution.discriminant)})) / {2 * av}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
