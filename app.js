/**
 * POE Harvest Color Maximizer - Refactored
 * A tool for optimizing Path of Exile harvest farming strategies
 */

// =========================
// Configuration Module
// =========================
const CONFIG = {
  COLORS: [
    { name: 'Yellow', hex: '#ffe066', hue: 52 },
    { name: 'Purple', hex: '#b266ff', hue: 270 },
    { name: 'Blue', hex: '#66b2ff', hue: 210 }
  ],
  
  TIER_SCORES: {
    MAX_COLOR: {
      1: 1,
      2: 20,
      3: 100,
      4: 300,
      calculateHighTier: (tier) => 300 + (tier - 4) * (150 * (tier - 3))
    },
    NON_MAX_COLOR: {
      1: 0.5,
      2: 10,
      3: 50,
      4: 90,
      calculateHighTier: (tier) => (300 + (tier - 4) * (150 * (tier - 3))) * 0.3
    }
  },
  
  CHART_SETTINGS: {
    WIDTH: 320,
    HEIGHT: 320,
    SATURATION: 90,
    BASE_LIGHTNESS: 32,
    LIGHTNESS_INCREMENT: 12,
    MAX_LIGHTNESS: 80
  },
  
  LIMITS: {
    MIN_PAIRS: 1,
    MAX_PAIRS: 10,
    DEFAULT_PAIRS: 3
  }
};

// =========================
// Utility Functions
// =========================
const Utils = {
  cloneDeep: (obj) => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to clone object:', error);
      return {};
    }
  },
  
  // Optimized shallow clone for simple objects
  shallowClone: (obj) => ({ ...obj }),
  
  // Optimized deep clone for specific data structures
  cloneGameState: (state) => ({
    queue: state.queue.map(item => ({
      ...item,
      colors: item.colors.map(color => ({ ...color }))
    })),
    virtualCount: { ...state.virtualCount },
    lootTiers: {
      Yellow: { ...state.lootTiers.Yellow },
      Purple: { ...state.lootTiers.Purple },
      Blue: { ...state.lootTiers.Blue }
    },
    colorCounts: { ...state.colorCounts },
    maximizeColor: state.maximizeColor,
    log: [...state.log]
  }),
  
  validateInput: (value, min, max) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  },
  
  validatePairs: (pairs) => {
    if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new Error('At least one pair is required');
    }
    
    pairs.forEach((pair, index) => {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error(`Invalid pair format at index ${index}`);
      }
      
      const [color1, color2] = pair;
      const validColors = CONFIG.COLORS.map(c => c.name);
      
      if (!validColors.includes(color1) || !validColors.includes(color2)) {
        throw new Error(`Invalid color in pair ${index + 1}`);
      }
    });
    
    return true;
  },
  
  getColorByName: (name) => CONFIG.COLORS.find(color => color.name === name),
  
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },
  
  sanitizeHtml: (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// =========================
// Score Calculator Module
// =========================
const ScoreCalculator = {
  getTierScore: (tier, isMaxColor = true) => {
    const scores = isMaxColor ? CONFIG.TIER_SCORES.MAX_COLOR : CONFIG.TIER_SCORES.NON_MAX_COLOR;
    
    if (tier <= 4) {
      return scores[tier];
    }
    
    return isMaxColor 
      ? scores.calculateHighTier(tier)
      : scores.calculateHighTier(tier);
  },
  
  calculateTotalValue: (lootTiers, maximizeColor) => {
    let totalValue = 0;
    
    Object.entries(lootTiers).forEach(([color, tiers]) => {
      const isMaxColor = color === maximizeColor;
      Object.entries(tiers).forEach(([tier, count]) => {
        totalValue += ScoreCalculator.getTierScore(parseInt(tier), isMaxColor) * count;
      });
    });
    
    return totalValue;
  }
};

// =========================
// UI Module
// =========================
const UI = {
  elements: {},
  
  init: () => {
    UI.elements = {
      numPairsInput: document.getElementById('numPairs'),
      pairsContainer: document.getElementById('pairsContainer'),
      maximizeColorSelect: document.getElementById('maximizeColor'),
      calcButton: document.getElementById('calcBtn'),
      stepOutput: document.getElementById('stepOutput'),
      lootSummaryContent: document.getElementById('lootSummaryContent'),
      lootPieChart: document.getElementById('lootPieChart'),
      rainbowTitle: document.getElementById('rainbow-title'),
      // Market values elements
      vividRate: document.getElementById('vividRate'),
      primalRate: document.getElementById('primalRate'),
      wildRate: document.getElementById('wildRate'),
      // Lifeforce calculator elements
      vividGained: document.getElementById('vividGained'),
      primalGained: document.getElementById('primalGained'),
      wildGained: document.getElementById('wildGained'),
      totalValue: document.getElementById('totalValue'),
      totalDivValue: document.getElementById('totalDivValue'),
      clearCalc: document.getElementById('clearCalc'),
      priceTimestamp: document.getElementById('priceTimestamp')
    };
    
    UI.setupEventListeners();
    UI.initializeTitle();
    UI.renderPairs();
    UI.updateLifeforceValue(); // Initialize calculator
    UI.loadPriceTimestamp(); // Load price timestamp
    
    // Update timestamp every minute
    setInterval(UI.loadPriceTimestamp, 60000);
  },
  
  setupEventListeners: () => {
    UI.elements.numPairsInput.addEventListener('input', Utils.debounce(UI.handlePairsChange, 300));
    UI.elements.maximizeColorSelect.addEventListener('change', UI.handleMaximizeColorChange);
    UI.elements.calcButton.addEventListener('click', UI.handleCalculate);
    
    // Lifeforce calculator event listeners
    const lifeforceInputs = [
      UI.elements.vividGained,
      UI.elements.primalGained,
      UI.elements.wildGained,
      UI.elements.vividRate,
      UI.elements.primalRate,
      UI.elements.wildRate
    ];
    
    lifeforceInputs.forEach(input => {
      input.addEventListener('input', UI.updateLifeforceValue);
    });
    
    UI.elements.clearCalc.addEventListener('click', UI.clearLifeforceCalculator);
  },
  
  initializeTitle: () => {
    const title = "pov's math time";
    const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
    
    UI.elements.rainbowTitle.innerHTML = title
      .split('')
      .map((char, index) => {
        if (char === ' ') return char;
        const color = colors[index % colors.length];
        return `<span style="color: ${color}">${char}</span>`;
      })
      .join('');
  },
  
  handlePairsChange: () => {
    const value = UI.elements.numPairsInput.value;
    if (Utils.validateInput(value, CONFIG.LIMITS.MIN_PAIRS, CONFIG.LIMITS.MAX_PAIRS)) {
      UI.renderPairs();
    }
  },
  
  handleMaximizeColorChange: () => {
    UI.setSelectColor(UI.elements.maximizeColorSelect);
  },
  
  handleCalculate: () => {
    try {
      const pairs = UI.getPairs();
      const maximizeColor = UI.elements.maximizeColorSelect.value;
      
      // Validate inputs
      Utils.validatePairs(pairs);
      
      if (!Utils.getColorByName(maximizeColor)) {
        throw new Error('Invalid maximize color selected');
      }
      
      // Disable button during calculation
      UI.elements.calcButton.disabled = true;
      UI.elements.calcButton.textContent = 'Processing...';
      
      // Clear previous results
      UI.elements.stepOutput.innerHTML = '';
      
      Calculator.startStepMode(pairs, maximizeColor);
    } catch (error) {
      UI.showError('Error starting calculation: ' + error.message);
      console.error('Calculation error:', error);
    } finally {
      // Re-enable button
      setTimeout(() => {
        UI.elements.calcButton.disabled = false;
        UI.elements.calcButton.textContent = 'Start Step-by-Step Analysis';
      }, 1000);
    }
  },
  
  setSelectColor: (selectElement) => {
    const colorName = selectElement.value;
    const color = Utils.getColorByName(colorName);
    if (color) {
      selectElement.style.color = color.hex;
    }
  },
  
  createColorSelect: (id, defaultValue) => {
    const select = document.createElement('select');
    select.id = id;
    
    CONFIG.COLORS.forEach(color => {
      const option = document.createElement('option');
      option.value = color.name;
      option.textContent = color.name;
      option.style.color = color.hex;
      select.appendChild(option);
    });
    
    select.value = defaultValue || CONFIG.COLORS[0].name;
    UI.setSelectColor(select);
    
    select.addEventListener('change', () => UI.setSelectColor(select));
    return select;
  },
  
  renderPairs: () => {
    const numPairs = parseInt(UI.elements.numPairsInput.value) || CONFIG.LIMITS.DEFAULT_PAIRS;
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < numPairs; i++) {
      const row = document.createElement('div');
      row.className = 'pair-row';
      
      const select1 = UI.createColorSelect(`pair${i}_1`, CONFIG.COLORS[i % 3].name);
      const select2 = UI.createColorSelect(`pair${i}_2`, CONFIG.COLORS[(i + 1) % 3].name);
      
      row.appendChild(select1);
      row.appendChild(select2);
      fragment.appendChild(row);
    }
    
    // Single DOM update
    UI.elements.pairsContainer.innerHTML = '';
    UI.elements.pairsContainer.appendChild(fragment);
  },
  
  getPairs: () => {
    const numPairs = parseInt(UI.elements.numPairsInput.value) || 0;
    const pairs = [];
    
    for (let i = 0; i < numPairs; i++) {
      const select1 = document.getElementById(`pair${i}_1`);
      const select2 = document.getElementById(`pair${i}_2`);
      
      if (select1 && select2) {
        pairs.push([select1.value, select2.value]);
      }
    }
    
    return pairs;
  },
  
  showError: (message) => {
    const sanitizedMessage = Utils.sanitizeHtml(message);
    UI.elements.stepOutput.innerHTML = `
      <div class="error-message" role="alert">
        <strong>Error:</strong> ${sanitizedMessage}
      </div>
    `;
    UI.elements.stepOutput.style.display = 'block';
    UI.elements.stepOutput.classList.add('visible');
  },
  
  showSuccess: (message) => {
    const sanitizedMessage = Utils.sanitizeHtml(message);
    UI.elements.stepOutput.innerHTML = `
      <div class="success-message" role="status">
        <strong>Success:</strong> ${sanitizedMessage}
      </div>
    `;
    UI.elements.stepOutput.style.display = 'block';
    UI.elements.stepOutput.classList.add('visible');
  },
  
  updateLootSummary: (lootTiers) => {
    const colors = CONFIG.COLORS.map(c => c.name);
    const colorEmojis = { Yellow: '🟡', Purple: '🟣', Blue: '🔵' };
    
    const allTiers = new Set();
    colors.forEach(color => {
      Object.keys(lootTiers[color] || {}).forEach(tier => allTiers.add(Number(tier)));
    });
    
    const sortedTiers = Array.from(allTiers).sort((a, b) => a - b);
    
    // Use template strings for better performance
    const tableRows = sortedTiers.map(tier => {
      const cells = colors.map(color => {
        const count = lootTiers[color]?.[tier] || 0;
        return `<td>${count}</td>`;
      }).join('');
      return `<tr><td>T${tier}</td>${cells}</tr>`;
    }).join('');
    
    const headerCells = colors.map(color => `<th>${colorEmojis[color]}</th>`).join('');
    
    UI.elements.lootSummaryContent.innerHTML = `
      <table class="loot-table">
        <thead>
          <tr><th>Tier</th>${headerCells}</tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
  },
  
  updateLifeforceValue: () => {
    const vividGained = parseFloat(UI.elements.vividGained.value) || 0;
    const primalGained = parseFloat(UI.elements.primalGained.value) || 0;
    const wildGained = parseFloat(UI.elements.wildGained.value) || 0;
    
    const vividRate = parseFloat(UI.elements.vividRate.value) || 0;
    const primalRate = parseFloat(UI.elements.primalRate.value) || 0;
    const wildRate = parseFloat(UI.elements.wildRate.value) || 0;
    
    // Calculate value: lifeforce_gained / lifeforce_per_chaos = chaos_value
    const vividValue = vividRate > 0 ? vividGained / vividRate : 0;
    const primalValue = primalRate > 0 ? primalGained / primalRate : 0;
    const wildValue = wildRate > 0 ? wildGained / wildRate : 0;
    
    const totalChaosValue = vividValue + primalValue + wildValue;
    
    // Get divine/chaos ratio from saved data
    UI.getDivineRatio().then(divineRatio => {
      const totalDivValue = divineRatio > 0 ? totalChaosValue / divineRatio : 0;
      
      UI.elements.totalValue.textContent = totalChaosValue.toFixed(2);
      UI.elements.totalDivValue.textContent = totalDivValue.toFixed(3);
    }).catch(() => {
      // Fallback if can't get divine ratio
      UI.elements.totalValue.textContent = totalChaosValue.toFixed(2);
      UI.elements.totalDivValue.textContent = '0.000';
    });
  },
  
  getDivineRatio: () => {
    return fetch('lifeforce_prices.json')
      .then(response => response.json())
      .then(data => data.divine_chaos_ratio || 0)
      .catch(() => 0);
  },
  
  clearLifeforceCalculator: () => {
    UI.elements.vividGained.value = '0';
    UI.elements.primalGained.value = '0';
    UI.elements.wildGained.value = '0';
    UI.updateLifeforceValue();
  },
  
  loadPriceTimestamp: () => {
    fetch('lifeforce_prices.json')
      .then(response => response.json())
      .then(data => {
        const lastUpdated = new Date(data.last_updated);
        const now = new Date();
        const timeDiff = now - lastUpdated;
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeText = '';
        if (hours > 0) {
          timeText += `${hours}h `;
        }
        if (minutes > 0 || hours === 0) {
          timeText += `${minutes}m`;
        }
        
        // Determine if prices are outdated (more than 24 hours old)
        const isOutdated = timeDiff > 24 * 60 * 60 * 1000;
        
        const divineRatio = data.divine_chaos_ratio || 0;
        UI.elements.priceTimestamp.innerHTML = `
          <small>Prices fetched ${timeText} ago (${data.league})<br>
          Divine: ${divineRatio.toFixed(1)}c</small>
        `;
        
        if (isOutdated) {
          UI.elements.priceTimestamp.classList.add('outdated');
        } else {
          UI.elements.priceTimestamp.classList.remove('outdated');
        }
      })
      .catch(error => {
        console.error('Error loading price timestamp:', error);
        UI.elements.priceTimestamp.innerHTML = `
          <small>Price data unavailable</small>
        `;
        UI.elements.priceTimestamp.classList.add('error');
      });
  },
  
};

// =========================
// Chart Module
// =========================
const ChartModule = {
  chart: null,
  
  getColorShade: (colorName, tier) => {
    const color = Utils.getColorByName(colorName);
    if (!color) return '#ffffff';
    
    const { hue } = color;
    const saturation = CONFIG.CHART_SETTINGS.SATURATION;
    let lightness = CONFIG.CHART_SETTINGS.BASE_LIGHTNESS + (tier - 1) * CONFIG.CHART_SETTINGS.LIGHTNESS_INCREMENT;
    
    if (lightness > CONFIG.CHART_SETTINGS.MAX_LIGHTNESS) {
      lightness = CONFIG.CHART_SETTINGS.MAX_LIGHTNESS;
    }
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  },
  
  updateChart: (lootTiers) => {
    try {
      const canvasId = 'lootPieChartCanvas';
      UI.elements.lootPieChart.innerHTML = `<canvas id="${canvasId}" width="${CONFIG.CHART_SETTINGS.WIDTH}" height="${CONFIG.CHART_SETTINGS.HEIGHT}"></canvas>`;
      
      const ctx = document.getElementById(canvasId);
      if (!ctx) {
        console.error('Canvas element not found');
        return;
      }
      
      const context = ctx.getContext('2d');
      const data = [];
      const labels = [];
      const backgroundColors = [];
      
      CONFIG.COLORS.forEach(color => {
        const colorName = color.name;
        const tierData = lootTiers[colorName] || {};
        
        Object.keys(tierData)
          .sort((a, b) => a - b)
          .forEach(tier => {
            const count = tierData[tier];
            if (count > 0) {
              data.push(count);
              labels.push(`${colorName} T${tier}`);
              backgroundColors.push(ChartModule.getColorShade(colorName, parseInt(tier)));
            }
          });
      });
      
      if (ChartModule.chart) {
        ChartModule.chart.destroy();
      }
      
      if (data.length === 0) {
        UI.elements.lootPieChart.innerHTML = '<div class="no-data">No loot data available</div>';
        return;
      }
      
      ChartModule.chart = new Chart(context, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColors,
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
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } catch (error) {
      console.error('Error updating chart:', error);
      UI.elements.lootPieChart.innerHTML = '<div class="chart-error">Error loading chart</div>';
    }
  }
};

// =========================
// Calculator Module
// =========================
const Calculator = {
  stepState: null,
  
  startStepMode: (pairs, maximizeColor) => {
    try {
      Calculator.stepState = {
        queue: [],
        virtualCount: {},
        lootTiers: { Yellow: {}, Purple: {}, Blue: {} },
        colorCounts: { Yellow: 0, Purple: 0, Blue: 0 },
        maximizeColor,
        log: []
      };
      
      pairs.forEach((pair, index) => {
        Calculator.stepState.queue.push({
          colors: [
            { color: pair[0], tier: 1 },
            { color: pair[1], tier: 1 }
          ],
          label: `Pair ${index + 1}`,
          fromPairIdx: index,
          isVirtual: false,
          parentLabel: null
        });
      });
      
      Calculator.renderStep();
    } catch (error) {
      console.error('Error in startStepMode:', error);
      throw error;
    }
  },
  
  renderStep: () => {
    if (!Calculator.stepState || Calculator.stepState.queue.length === 0) {
      UI.elements.stepOutput.innerHTML = '<b>Step-by-step complete!</b>';
      UI.updateLootSummary(Calculator.stepState ? Calculator.stepState.lootTiers : { Yellow: {}, Purple: {}, Blue: {} });
      ChartModule.updateChart(Calculator.stepState ? Calculator.stepState.lootTiers : { Yellow: {}, Purple: {}, Blue: {} });
      return;
    }
    
    const bestChoice = Calculator.findBestChoice();
    Calculator.displayStep(bestChoice);
    UI.updateLootSummary(Calculator.stepState.lootTiers);
    ChartModule.updateChart(Calculator.stepState.lootTiers);
  },
  
  findBestChoice: () => {
    const { queue, maximizeColor } = Calculator.stepState;
    let bestValue = -Infinity;
    let bestChoice = null;
    
    queue.forEach((queueItem, queueIndex) => {
      queueItem.colors.forEach((colorObj, colorIndex) => {
        const simulatedValue = Calculator.simulateChoice(queueIndex, colorIndex);
        
        if (simulatedValue > bestValue) {
          bestValue = simulatedValue;
          bestChoice = {
            queueIndex,
            colorIndex,
            queueItem,
            colorObj,
            value: simulatedValue
          };
        }
      });
    });
    
    return bestChoice;
  },
  
  simulateChoice: (queueIndex, colorIndex) => {
    const stateCopy = Utils.cloneGameState(Calculator.stepState);
    const { colors, label } = stateCopy.queue[queueIndex];
    const pickObj = colors[colorIndex];
    
    // Add loot
    if (!stateCopy.lootTiers[pickObj.color][pickObj.tier]) {
      stateCopy.lootTiers[pickObj.color][pickObj.tier] = 0;
    }
    stateCopy.lootTiers[pickObj.color][pickObj.tier]++;
    
    // Tier up other colors
    stateCopy.queue.forEach((item, index) => {
      if (index !== queueIndex) {
        item.colors.forEach(colorObj => {
          if (colorObj.color !== pickObj.color) {
            colorObj.tier++;
          }
        });
      }
    });
    
    // Remove picked item
    stateCopy.queue.splice(queueIndex, 1);
    
    // Simulate remaining picks greedily
    while (stateCopy.queue.length > 0) {
      let bestValue = -Infinity;
      let bestIndex = -1;
      let bestColorIndex = -1;
      
      stateCopy.queue.forEach((item, index) => {
        item.colors.forEach((colorObj, colorIdx) => {
          const isMaxColor = colorObj.color === stateCopy.maximizeColor;
          const value = ScoreCalculator.getTierScore(colorObj.tier, isMaxColor);
          
          if (value > bestValue) {
            bestValue = value;
            bestIndex = index;
            bestColorIndex = colorIdx;
          }
        });
      });
      
      if (bestIndex === -1) break;
      
      const bestPick = stateCopy.queue[bestIndex].colors[bestColorIndex];
      
      // Add loot
      if (!stateCopy.lootTiers[bestPick.color][bestPick.tier]) {
        stateCopy.lootTiers[bestPick.color][bestPick.tier] = 0;
      }
      stateCopy.lootTiers[bestPick.color][bestPick.tier]++;
      
      // Tier up
      stateCopy.queue.forEach((item, index) => {
        if (index !== bestIndex) {
          item.colors.forEach(colorObj => {
            if (colorObj.color !== bestPick.color) {
              colorObj.tier++;
            }
          });
        }
      });
      
      stateCopy.queue.splice(bestIndex, 1);
    }
    
    try {
      return ScoreCalculator.calculateTotalValue(stateCopy.lootTiers, stateCopy.maximizeColor);
    } catch (error) {
      console.error('Error in calculateTotalValue:', error);
      console.error('lootTiers:', stateCopy.lootTiers);
      console.error('maximizeColor:', stateCopy.maximizeColor);
      return 0;
    }
  },
  
  displayStep: (bestChoice) => {
    const { queueItem, colorObj, queueIndex, colorIndex } = bestChoice;
    const otherColorObj = queueItem.colors.length === 2 ? queueItem.colors[1 - colorIndex] : null;
    
    let html = `<b>Step-by-Step Mode</b><br><br>`;
    html += `<div><b>Current State:</b></div>`;
    html += `<ul style="margin-bottom:8px;">`;
    
    Calculator.stepState.queue.forEach((q, i) => {
      html += `<li>${q.label}: ` + q.colors.map(obj => {
        const colorClass = `loot-${obj.color.toLowerCase()}`;
        return `<span class="${colorClass}">${obj.color} (T${obj.tier})</span>`;
      }).join(', ') + `</li>`;
    });
    
    html += `</ul>`;
    
    const stepDesc = `${queueItem.label}: Pick <b>${colorObj.color}</b> (T${colorObj.tier})`;
    html += `<div><b>Next Pick:</b> ${stepDesc}</div>`;
    
    if (otherColorObj) {
      html += `<div style="margin-top:8px;">Did <b>${otherColorObj.color}</b> survive?</div>`;
      html += `<button onclick="Calculator.doStep(true, ${queueIndex}, ${colorIndex})">Yes</button> `;
      html += `<button onclick="Calculator.doStep(false, ${queueIndex}, ${colorIndex})">No</button>`;
    } else {
      html += `<div style="margin-top:8px;"><button onclick="Calculator.doStep(false, ${queueIndex}, ${colorIndex})">Confirm Pick</button></div>`;
    }
    
    html += `<div style="margin-top:16px;"><b>Step Log:</b><br>`;
    Calculator.stepState.log.forEach((entry, i) => {
      html += `<div>${i + 1}. ${entry}</div>`;
    });
    html += `</div>`;
    
    UI.elements.stepOutput.innerHTML = html;
    UI.elements.stepOutput.style.display = 'block';
  },
  
  doStep: (survived, pickIndex, pickColorIndex) => {
    const queue = Calculator.stepState.queue;
    const { colors, label, fromPairIdx, isVirtual, parentLabel } = queue[pickIndex];
    const pickObj = colors[pickColorIndex];
    const otherObj = colors.length === 2 ? colors[1 - pickColorIndex] : null;
    
    let stepDesc = `${label}: Pick <b>${pickObj.color}</b> (T${pickObj.tier})`;
    if (otherObj) {
      stepDesc += `, Other: ${otherObj.color} (T${otherObj.tier})`;
      stepDesc += survived ? ' [✝️]' : ' [💀]';
    }
    if (isVirtual && parentLabel) {
      stepDesc += ` (from ${parentLabel} survived)`;
    }
    
    Calculator.stepState.log.push(stepDesc);
    
    // Add loot
    if (!Calculator.stepState.lootTiers[pickObj.color][pickObj.tier]) {
      Calculator.stepState.lootTiers[pickObj.color][pickObj.tier] = 0;
    }
    Calculator.stepState.lootTiers[pickObj.color][pickObj.tier]++;
    Calculator.stepState.colorCounts[pickObj.color]++;
    
    // Handle survival
    if (!isVirtual && otherObj && survived) {
      if (!Calculator.stepState.virtualCount[fromPairIdx]) {
        Calculator.stepState.virtualCount[fromPairIdx] = 1;
      } else {
        Calculator.stepState.virtualCount[fromPairIdx]++;
      }
      
      const vLabel = `${label}.${Calculator.stepState.virtualCount[fromPairIdx]}`;
      queue.splice(pickIndex, 1);
      queue.push({
        colors: [{ color: otherObj.color, tier: otherObj.tier }],
        label: vLabel,
        fromPairIdx,
        isVirtual: true,
        parentLabel: label
      });
      
      Calculator.renderStep();
      return;
    }
    
    // Tier up other colors
    queue.forEach((item, index) => {
      if (index !== pickIndex) {
        item.colors.forEach(colorObj => {
          if (colorObj.color !== pickObj.color) {
            colorObj.tier++;
          }
        });
      }
    });
    
    queue.splice(pickIndex, 1);
    Calculator.renderStep();
  }
};

// =========================
// Application Initialization
// =========================
class HarvestApp {
  constructor() {
    this.init();
  }
  
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      UI.init();
      UI.setSelectColor(UI.elements.maximizeColorSelect);
    });
  }
}

// Global exposure for event handlers
window.Calculator = Calculator;

// Initialize the application
new HarvestApp();