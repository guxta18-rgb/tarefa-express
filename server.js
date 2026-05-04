const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   Funções auxiliares para coleta de dados
========================= */
function gb(v) { return (v / 1024 / 1024 / 1024).toFixed(2); }
function mb(v) { return (v / 1024 / 1024).toFixed(2); }

function percent(part, total) {
  if (!total) return "0";
  return ((part / total) * 100).toFixed(0);
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function getIPs() {
  const nets = os.networkInterfaces();
  const list = [];
  for (const name in nets) {
    for (const net of nets[name]) {
      list.push({
        interface: name,
        address: net.address,
        family: net.family
      });
    }
  }
  return list;
}

function getMainIP(ips) {
  const ip = ips.find(i => !i.internal && i.family === "IPv4");
  return ip ? ip.address : "N/A";
}

function getFilesDetailed() {
  try {
    return fs.readdirSync(".").slice(0, 10).map(file => {
      const stat = fs.statSync(path.join(".", file));
      return {
        name: file,
        type: stat.isDirectory() ? "Dir" : "Arquivo",
        size: stat.isDirectory() ? "-" : `${(stat.size / 1024).toFixed(2)} KB`
      };
    });
  } catch { return []; }
}

function cpuStats() {
  return os.cpus().map((cpu, index) => {
    const t = cpu.times;
    const total = t.user + t.nice + t.sys + t.idle + t.irq;
    const used = total - t.idle;
    return { core: index, model: cpu.model, usage: percent(used, total) };
  });
}

function healthStatus(ramUsage, loadAvg, cores) {
  if (ramUsage > 85 || loadAvg > cores) return { label: "CRÍTICO", color: "#ff003c" };
  if (ramUsage > 65 || loadAvg > cores * 0.7) return { label: "ALERTA", color: "#f59e0b" };
  return { label: "NORMAL", color: "#00ff41" };
}

/* =========================
   Rota principal com HTML e CSS Hacker
========================= */
app.get("/", (req, res) => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const ramPercent = Number(percent(used, total));
  const cpus = cpuStats();
  const avgCpu = (cpus.reduce((sum, c) => sum + Number(c.usage), 0) / cpus.length).toFixed(0);
  const load = os.loadavg();
  const ips = getIPs();
  const mainIP = getMainIP(ips);
  const files = getFilesDetailed();
  const user = os.userInfo();
  const uptime = os.uptime();
  const health = healthStatus(ramPercent, load[0], cpus.length);

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="5">
<title>SO Dashboard 3.0 - Cyberpunk Edition</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
  body { font-family: 'Roboto Mono', monospace; background: #0a0a0c; color: #00ff41; margin: 0; padding: 20px; }
  h1 { text-align: center; letter-spacing: 4px; color: #00ff41; text-shadow: 0 0 10px #00ff41; }
  .subtitle { text-align: center; color: #008f11; margin-bottom: 25px; font-size: 0.8em; }
  .top-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px; }
  .card { background: rgba(20, 20, 25, 0.9); border: 1px solid #00ff4144; border-radius: 4px; padding: 15px; box-shadow: 0 0 10px rgba(0,255,65,0.05); }
  .kpi { text-align: center; }
  .kpi h3 { margin: 0; font-size: 11px; color: #008f11; }
  .kpi .value { font-size: 20px; font-weight: bold; margin-top: 5px; }
  .bar { background: #1a1a1f; height: 10px; border-radius: 2px; overflow: hidden; margin: 5px 0; border: 1px solid #00ff4133; }
  .fill { background: #00ff41; height: 100%; box-shadow: 0 0 8px #00ff41; }
  h2 { font-size: 1.1em; margin-top: 0; border-bottom: 1px solid #00ff4133; padding-bottom: 5px; }
  p { font-size: 0.85em; margin: 6px 0; }
  b { color: #008f11; }
  table { width: 100%; border-collapse: collapse; font-size: 0.75em; margin-top: 10px; }
  th { text-align: left; color: #008f11; border-bottom: 1px solid #00ff4133; padding: 5px; }
  td { padding: 5px; border-bottom: 1px solid #ffffff05; }
  .badge { padding: 3px 8px; border-radius: 3px; color: #000; font-weight: bold; font-size: 10px; }
  .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #004d0b; }
</style>
</head>
<body>

<h1>🖥️ SO DASHBOARD 3.0</h1>
<div class="subtitle">SYSTEM_LOCAL_TIME: ${new Date().toLocaleString()}</div>

<div class="top-grid">
  <div class="card kpi"><h3>RAM</h3><div class="value">${ramPercent}%</div></div>
  <div class="card kpi"><h3>CPU MÉDIA</h3><div class="value">${avgCpu}%</div></div>
  <div class="card kpi"><h3>UPTIME</h3><div class="value" style="font-size:14px">${formatUptime(uptime)}</div></div>
  <div class="card kpi"><h3>ARQUIVOS</h3><div class="value">${files.length}</div></div>
  <div class="card kpi"><h3>IP PRINCIPAL</h3><div class="value" style="font-size:13px">${mainIP}</div></div>
  <div class="card kpi"><h3>STATUS</h3><div class="value"><span class="badge" style="background:${health.color}">${health.label}</span></div></div>
</div>

<div class="grid">
  <div class="card">
    <h2>📌 SISTEMA</h2>
    <p><b>Host:</b> ${os.hostname()}</p>
    <p><b>SO:</b> ${os.type()}</p>
    <p><b>Release:</b> ${os.release()}</p>
    <p><b>Arquitetura:</b> ${os.arch()}</p>
    <p><b>Node:</b> ${process.version}</p>
  </div>

  <div class="card">
    <h2>👤 USUÁRIO</h2>
    <p><b>Usuário:</b> ${user.username}</p>
    <p><b>Home:</b> ${os.homedir()}</p>
    <p><b>Shell:</b> ${user.shell || "N/A"}</p>
  </div>

  <div class="card">
    <h2>🧠 MEMÓRIA RAM</h2>
    <p><b>Total:</b> ${gb(total)} GB</p>
    <p><b>Usada:</b> ${gb(used)} GB</p>
    <p><b>Livre:</b> ${gb(free)} GB</p>
    <div class="bar"><div class="fill" style="width:${ramPercent}%"></div></div>
  </div>

  <div class="card">
    <h2>⚙️ CPU</h2>
    <p><b>Modelo:</b> ${cpus[0].model}</p>
    <p><b>Load Avg:</b> ${load.map(v => v.toFixed(2)).join(" | ")}</p>
    ${cpus.slice(0, 4).map(c => `
      <div style="font-size:10px; margin-top:5px;">Core ${c.core}: ${c.usage}%</div>
      <div class="bar"><div class="fill" style="width:${c.usage}%"></div></div>
    `).join("")}
    <p style="font-size:9px; color:#008f11;">(Mostrando primeiros 4 núcleos)</p>
  </div>

  <div class="card">
    <h2>🌐 REDE</h2>
    <table>
      <tr><th>IF</th><th>IP</th><th>FAM</th></tr>
      ${ips.slice(0, 5).map(ip => `<tr><td>${ip.interface}</td><td>${ip.address}</td><td>${ip.family}</td></tr>`).join("")}
    </table>
  </div>

  <div class="card">
    <h2>📂 ARQUIVOS</h2>
    <table>
      <tr><th>NOME</th><th>TIPO</th><th>TAM</th></tr>
      ${files.map(f => `<tr><td>${f.name}</td><td>${f.type}</td><td>${f.size}</td></tr>`).join("")}
    </table>
  </div>

  <div class="card">
    <h2>⏰ TEMPO</h2>
    <p><b>Timezone:</b> ${Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
    <p><b>ISO:</b> ${new Date().toISOString()}</p>
  </div>

  <div class="card">
    <h2>🔐 APLICAÇÃO</h2>
    <p><b>PID:</b> ${process.pid}</p>
    <p><b>Memória Node:</b> ${mb(process.memoryUsage().rss)} MB</p>
    <p><b>CWD:</b> ${process.cwd()}</p>
  </div>

  <div class="card">
    <h2>☁️ AMBIENTE</h2>
    <p><b>Status:</b> Executando Localmente</p>
    <p><b>PORT:</b> ${PORT}</p>
    <p><b>NODE_ENV:</b> ${process.env.NODE_ENV || "development"}</p>
  </div>
</div>

<div class="footer">SO Dashboard 3.0 • Sistemas Operacionais + Cloud Computing</div>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log("Servidor rodando em http://localhost:" + PORT);
});