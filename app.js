// Main JS logic for POE Harvest Color Maximizer
// (This will be filled in with the logic from the previous HTML file) 

// =========================
// 1. State & Config
// =========================
const colorOptions = [
  { name: "Yellow", color: "#ffe066" },
  { name: "Purple", color: "#b266ff" },
  { name: "Blue", color: "#66b2ff" }
];

// =========================
// 2. UI Rendering
// =========================
const pairsContainer = document.getElementById('pairsContainer');
const numPairsInput = document.getElementById('numPairs');

function setSelectColor(select) {
  const val = select.value;
  const found = colorOptions.find(opt => opt.name === val);
  if (found) {
    select.style.color = found.color;
  }
}

function renderPairs() {
  pairsContainer.innerHTML = '';
  const numPairs = parseInt(numPairsInput.value);
  for (let i = 0; i < numPairs; i++) {
    const row = document.createElement('div');
    row.className = 'pair-row';
    const select1 = document.createElement('select');
    const select2 = document.createElement('select');
    colorOptions.forEach(opt => {
      const opt1 = document.createElement('option');
      opt1.value = opt.name;
      opt1.textContent = opt.name;
      opt1.style.color = opt.color;
      select1.appendChild(opt1);
      const opt2 = document.createElement('option');
      opt2.value = opt.name;
      opt2.textContent = opt.name;
      opt2.style.color = opt.color;
      select2.appendChild(opt2);
    });
    select1.value = colorOptions[i % 3].name;
    select2.value = colorOptions[(i+1) % 3].name;
    select1.id = `pair${i}_1`;
    select2.id = `pair${i}_2`;
    setSelectColor(select1);
    setSelectColor(select2);
    select1.addEventListener('change', function() { setSelectColor(this); });
    select2.addEventListener('change', function() { setSelectColor(this); });
    row.appendChild(select1);
    row.appendChild(select2);
    pairsContainer.appendChild(row);
  }
}

document.getElementById('maximizeColor').addEventListener('change', function() {
  setSelectColor(this);
});
window.addEventListener('DOMContentLoaded', function() {
  setSelectColor(document.getElementById('maximizeColor'));
  renderPairs();
  // Rainbow title effect
  const title = "pov's math time";
  const colors = [
    '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93',
    '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93',
    '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93',
  ];
  const rainbowTitle = document.getElementById('rainbow-title');
  rainbowTitle.innerHTML = '';
  for (let i = 0; i < title.length; i++) {
    const span = document.createElement('span');
    span.textContent = title[i];
    if (title[i] !== ' ') {
      span.style.color = colors[i % colors.length];
    }
    rainbowTitle.appendChild(span);
  }
});
numPairsInput.addEventListener('input', renderPairs);
window.addEventListener('DOMContentLoaded', renderPairs);

function getPairsAndSurvivals() {
  const numPairs = parseInt(numPairsInput.value);
  const pairs = [];
  for (let i = 0; i < numPairs; i++) {
    const c1 = document.getElementById(`pair${i}_1`).value;
    const c2 = document.getElementById(`pair${i}_2`).value;
    pairs.push([c1, c2]);
  }
  return { pairs };
}

// =========================
// 3. Algorithm & Step-by-Step Logic
// =========================

function getTierScore(tier) {
  if (tier === 1) return 1;
  if (tier === 2) return 20;
  if (tier === 3) return 100;
  if (tier === 4) return 300;
  return 300 + (tier - 4) * (150 * (tier - 3));
}
function getNonMaxTierScore(tier) {
  if (tier === 1) return 1 * 0.5;
  if (tier === 2) return 20 * 0.5;
  if (tier === 3) return 100 * 0.5;
  if (tier >= 4) return (300 + (tier - 4) * (150 * (tier - 3))) * 0.3;
}

let lootPieChart = null;

function getColorShade(base, tier) {
  // base: hex string, tier: 1+ (darker for T1, lighter for higher tiers)
  let colorMap = {
    Yellow: 52, // H
    Purple: 270,
    Blue: 210
  };
  let h = colorMap[base];
  let s = 90;
  // T1: 32%, T2: 44%, T3: 56%, T4: 68%, T5+: 80%
  let l = 32 + (tier-1)*12;
  if (l > 80) l = 80;
  return `hsl(${h},${s}%,${l}%)`;
}

function updateLootPieChart(lootTiers) {
  const ctxId = 'lootPieChartCanvas';
  let chartDiv = document.getElementById('lootPieChart');
  chartDiv.innerHTML = '<canvas id="' + ctxId + '" width="320" height="320"></canvas>';
  let ctx = document.getElementById(ctxId).getContext('2d');
  let data = [];
  let labels = [];
  let bgColors = [];
  const colorOrder = ['Yellow', 'Purple', 'Blue'];
  colorOrder.forEach(color => {
    Object.keys(lootTiers[color]).sort((a,b)=>a-b).forEach(tier => {
      let count = lootTiers[color][tier];
      if (count > 0) {
        data.push(count);
        labels.push(`${color} T${tier}`);
        bgColors.push(getColorShade(color, parseInt(tier)));
      }
    });
  });
  if (lootPieChart) lootPieChart.destroy();
  lootPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        borderColor: '#23272f',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: '#fff',
            font: { size: 14 }
          }
        }
      }
    }
  });
}

function updateLootSummary(lootTiers) {
  const colors = ["Yellow", "Purple", "Blue"];
  const colorEmojis = { Yellow: '🟡', Purple: '🟣', Blue: '🔵' };
  let allTiers = new Set();
  colors.forEach(color => {
    Object.keys(lootTiers[color]).forEach(tier => allTiers.add(Number(tier)));
  });
  allTiers = Array.from(allTiers).sort((a, b) => a - b);
  let html = '<table class="loot-table"><thead><tr><th>Tier</th>';
  colors.forEach(color => {
    html += `<th>${colorEmojis[color]}</th>`;
  });
  html += '</tr></thead><tbody>';
  allTiers.forEach(tier => {
    html += `<tr><td>T${tier}</td>`;
    colors.forEach(color => {
      html += `<td>${lootTiers[color][tier] ? lootTiers[color][tier] : 0}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('lootSummaryContent').innerHTML = html;
  updateLootPieChart(lootTiers);
}

// --- Step-by-step mode state ---
let stepState = null;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function startStepMode(pairs, maximizeColor) {
  stepState = {
    queue: [],
    virtualCount: {},
    lootTiers: { Yellow: {}, Purple: {}, Blue: {} },
    colorCounts: { Yellow: 0, Purple: 0, Blue: 0 },
    maximizeColor,
    log: []
  };
  for (let i = 0; i < pairs.length; i++) {
    stepState.queue.push({
      colors: [
        { color: pairs[i][0], tier: 1 },
        { color: pairs[i][1], tier: 1 }
      ],
      label: `Pair ${i+1}`,
      fromPairIdx: i,
      isVirtual: false,
      parentLabel: null
    });
  }
  renderStep();
}

function renderStep() {
  const stepDiv = document.getElementById('stepOutput');
  if (!stepState || stepState.queue.length === 0) {
    stepDiv.innerHTML = '<b>Step-by-step complete!</b>';
    updateLootSummary(stepState ? stepState.lootTiers : { Yellow: {}, Purple: {}, Blue: {} });
    return;
  }
  // Greedy value-based pick: try all possible picks, simulate outcome, pick the one with highest value
  let maximizeColor = stepState.maximizeColor;
  let bestValue = -Infinity;
  let bestPickIdx = -1;
  let bestPickColorIdx = -1;
  let bestSim = null;
  let bestStepDesc = '';
  for (let i = 0; i < stepState.queue.length; i++) {
    const { colors, label, fromPairIdx, isVirtual, parentLabel } = stepState.queue[i];
    for (let colorIdx = 0; colorIdx < colors.length; colorIdx++) {
      // Simulate picking this node (assuming other dies)
      let simQueue = JSON.parse(JSON.stringify(stepState.queue));
      let simLoot = JSON.parse(JSON.stringify(stepState.lootTiers));
      let simColorCounts = JSON.parse(JSON.stringify(stepState.colorCounts));
      let simVirtualCount = JSON.parse(JSON.stringify(stepState.virtualCount));
      const pickObj = colors[colorIdx];
      const pick = pickObj.color;
      const pickTier = pickObj.tier;
      let otherObj = colors.length === 2 ? colors[1 - colorIdx] : null;
      let other = otherObj ? otherObj.color : null;
      let otherTier = otherObj ? otherObj.tier : null;
      // Add loot
      if (!simLoot[pick][pickTier]) simLoot[pick][pickTier] = 0;
      simLoot[pick][pickTier] += 1;
      simColorCounts[pick] += 1;
      // Tier up
      for (let j = 0; j < simQueue.length; j++) {
        if (j === i) continue;
        simQueue[j].colors.forEach(obj => {
          if (obj.color !== pick) obj.tier += 1;
        });
      }
      // Remove picked node
      simQueue.splice(i, 1);
      // Now, simulate picking the rest greedily (always pick the node that gives highest immediate value)
      let simValue = 0;
      // Add up current loot value
      for (let c of ["Yellow", "Purple", "Blue"]) {
        for (let t in simLoot[c]) {
          if (c === maximizeColor) simValue += getTierScore(Number(t)) * simLoot[c][t];
          else simValue += getNonMaxTierScore(Number(t)) * simLoot[c][t];
        }
      }
      let simQ = JSON.parse(JSON.stringify(simQueue));
      let simL = JSON.parse(JSON.stringify(simLoot));
      let simC = JSON.parse(JSON.stringify(simColorCounts));
      while (simQ.length > 0) {
        // Pick the node with the highest value (for maximize color, use getTierScore; for others, use getNonMaxTierScore)
        let bestV = -Infinity, bestI = -1, bestCI = -1;
        for (let si = 0; si < simQ.length; si++) {
          const { colors } = simQ[si];
          for (let sci = 0; sci < colors.length; sci++) {
            const c = colors[sci].color;
            const t = colors[sci].tier;
            let v = c === maximizeColor ? getTierScore(t) : getNonMaxTierScore(t);
            if (v > bestV) {
              bestV = v;
              bestI = si;
              bestCI = sci;
            }
          }
        }
        // Add loot
        const pickObj2 = simQ[bestI].colors[bestCI];
        const pick2 = pickObj2.color;
        const pickTier2 = pickObj2.tier;
        if (!simL[pick2][pickTier2]) simL[pick2][pickTier2] = 0;
        simL[pick2][pickTier2] += 1;
        simC[pick2] += 1;
        // Tier up
        for (let j = 0; j < simQ.length; j++) {
          if (j === bestI) continue;
          simQ[j].colors.forEach(obj => {
            if (obj.color !== pick2) obj.tier += 1;
          });
        }
        simQ.splice(bestI, 1);
      }
      // Add up final loot value
      let finalValue = 0;
      for (let c of ["Yellow", "Purple", "Blue"]) {
        for (let t in simL[c]) {
          if (c === maximizeColor) finalValue += getTierScore(Number(t)) * simL[c][t];
          else finalValue += getNonMaxTierScore(Number(t)) * simL[c][t];
        }
      }
      if (finalValue > bestValue) {
        bestValue = finalValue;
        bestPickIdx = i;
        bestPickColorIdx = colorIdx;
        bestSim = { simLoot: simL, simColorCounts: simC };
        bestStepDesc = `${label}: Pick <b>${pick}</b> (T${pickTier})` + (other ? `, Other: ${other} (T${otherTier})` : '') + (isVirtual && parentLabel ? ` (from ${parentLabel} survived)` : '');
      }
    }
  }
  // Show the best step
  let html = `<b>Step-by-Step Mode</b><br><br>`;
  html += `<div><b>Current State:</b></div>`;
  html += `<ul style=\"margin-bottom:8px;\">`;
  stepState.queue.forEach((q, i) => {
    html += `<li>${q.label}: ` + q.colors.map(obj => {
      let colorClass = obj.color === 'Yellow' ? 'loot-yellow' : obj.color === 'Purple' ? 'loot-purple' : 'loot-blue';
      return `<span class=\"${colorClass}\">${obj.color} (T${obj.tier})</span>`;
    }).join(', ') + `</li>`;
  });
  html += `</ul>`;
  html += `<div><b>Next Pick:</b> ${bestStepDesc}</div>`;
  const other = stepState.queue[bestPickIdx].colors.length === 2 ? stepState.queue[bestPickIdx].colors[1 - bestPickColorIdx].color : null;
  if (other) {
    html += `<div style=\"margin-top:8px;\">Did <b>${other}</b> survive?</div>`;
    html += `<button id=\"btnSurviveYes_${stepState.log.length}\">Yes</button> <button id=\"btnSurviveNo_${stepState.log.length}\">No</button>`;
  } else {
    html += `<div style=\"margin-top:8px;\"><button id=\"btnSurviveNo_${stepState.log.length}\">Confirm Pick</button></div>`;
  }
  html += `<div style=\"margin-top:16px;\"><b>Step Log:</b><br>`;
  stepState.log.forEach((entry, i) => {
    let logHtml = entry;
    if (entry.includes('did not survive')) logHtml += ' 💀';
    html += `<div>${i+1}. ${logHtml}</div>`;
  });
  html += `</div>`;
  stepDiv.innerHTML = html;
  stepDiv.style.display = '';
  setTimeout(() => {
    if (other) {
      const yesBtn = document.getElementById('btnSurviveYes_' + stepState.log.length);
      const noBtn = document.getElementById('btnSurviveNo_' + stepState.log.length);
      if (yesBtn) yesBtn.addEventListener('click', function() { doStep(true, bestPickIdx, bestPickColorIdx, true); });
      if (noBtn) noBtn.addEventListener('click', function() { doStep(false, bestPickIdx, bestPickColorIdx, true); });
    } else {
      const noBtn = document.getElementById('btnSurviveNo_' + stepState.log.length);
      if (noBtn) noBtn.addEventListener('click', function() { doStep(false, bestPickIdx, bestPickColorIdx, true); });
    }
  }, 0);
  updateLootSummary(stepState.lootTiers);
}

function doStep(survived, pickIdx, pickColorIdx, forceReplan) {
  const queue = stepState.queue;
  const { colors, label, fromPairIdx, isVirtual, parentLabel } = queue[pickIdx];
  const pickObj = colors[pickColorIdx];
  const pick = pickObj.color;
  const pickTier = pickObj.tier;
  let otherObj = colors.length === 2 ? colors[1 - pickColorIdx] : null;
  let other = otherObj ? otherObj.color : null;
  let otherTier = otherObj ? otherObj.tier : null;
  let stepDesc = `${label}: Pick <b>${pick}</b> (T${pickTier})`;
  if (other) stepDesc += `, Other: ${other} (T${otherTier})`;
  if (isVirtual && parentLabel) stepDesc += ` (from ${parentLabel} survived)`;
  if (other) {
    stepDesc += survived ? ' [✝️]' : ' [💀]';
  }
  stepState.log.push(stepDesc);
  if (!stepState.lootTiers[pick][pickTier]) stepState.lootTiers[pick][pickTier] = 0;
  stepState.lootTiers[pick][pickTier] += 1;
  stepState.colorCounts[pick] += 1;
  if (!isVirtual && other && survived) {
    if (!stepState.virtualCount[fromPairIdx]) stepState.virtualCount[fromPairIdx] = 1;
    else stepState.virtualCount[fromPairIdx] += 1;
    const vLabel = `${label}.${stepState.virtualCount[fromPairIdx]}`;
    // Remove the original pair before adding the survivor
    stepState.queue.splice(pickIdx, 1);
    stepState.queue.push({
      colors: [ { color: other, tier: otherTier } ],
      label: vLabel,
      fromPairIdx,
      isVirtual: true,
      parentLabel: label
    });
    // Replan from new state
    renderStep();
    return;
  }
  for (let j = 0; j < stepState.queue.length; j++) {
    if (j === pickIdx) continue;
    stepState.queue[j].colors.forEach(obj => {
      if (obj.color !== pick) obj.tier += 1;
    });
  }
  stepState.queue.splice(pickIdx, 1);
  renderStep();
}

// =========================
// 4. Event Handlers
// =========================
document.getElementById('calcBtn').addEventListener('click', () => {
  const { pairs } = getPairsAndSurvivals();
  const maximizeColor = document.getElementById('maximizeColor').value;
  console.log('Starting Step-by-Step');
  console.log('Pairs:', pairs);
  console.log('Maximize color:', maximizeColor);
  startStepMode(pairs, maximizeColor);
}); 