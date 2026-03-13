const sEls = {
  type: document.getElementById('structureType'),
  search: document.getElementById('searchType'),
  start: document.getElementById('startNodeInput'),
  target: document.getElementById('targetNodeInput'),
  treeInput: document.getElementById('treeInput'),
  graphInput: document.getElementById('graphInput'),
  treeWrap: document.getElementById('treeInputWrap'),
  graphWrap: document.getElementById('graphInputWrap'),
  loadBtn: document.getElementById('loadStructureBtn'),
  sampleBtn: document.getElementById('sampleBtn'),
  prepareBtn: document.getElementById('prepareSearchBtn'),
  nextBtn: document.getElementById('nextSearchBtn'),
  autoBtn: document.getElementById('autoSearchBtn'),
  resetBtn: document.getElementById('resetSearchBtn'),
  viz: document.getElementById('vizContainer'),
  status: document.getElementById('searchStatus'),
  stepCount: document.getElementById('searchStepCount'),
  metaStructure: document.getElementById('metaStructure'),
  metaNode: document.getElementById('metaNode'),
  metaFrontier: document.getElementById('metaFrontier'),
  metaVisited: document.getElementById('metaVisited'),
  log: document.getElementById('searchLog')
};

let structureState = null;
let searchSteps = [];
let searchIndex = 0;
let playingSearch = false;
let uiState = {
  start: null,
  target: null,
  current: null,
  frontier: [],
  visited: [],
  found: false
};

sEls.type.addEventListener('change', onStructureTypeChange);
sEls.loadBtn.addEventListener('click', loadStructureFromInputs);
sEls.sampleBtn.addEventListener('click', loadSampleStructure);
sEls.prepareBtn.addEventListener('click', prepareSearch);
sEls.nextBtn.addEventListener('click', nextSearchStep);
sEls.autoBtn.addEventListener('click', autoPlaySearch);
sEls.resetBtn.addEventListener('click', resetSearchVisualizer);

onStructureTypeChange();
loadStructureFromInputs();

function onStructureTypeChange() {
  const isTree = sEls.type.value === 'tree';
  sEls.treeWrap.classList.toggle('hidden', !isTree);
  sEls.graphWrap.classList.toggle('hidden', isTree);
  loadSampleStructure();
}

function loadSampleStructure() {
  if (sEls.type.value === 'tree') {
    sEls.treeInput.value = 'A,B,C,D,E,null,F';
    sEls.start.value = 'A';
    sEls.target.value = 'F';
  } else {
    sEls.graphInput.value = 'A-B, A-C, B-D, C-E, D-F, E-G';
    sEls.start.value = 'A';
    sEls.target.value = 'G';
  }
  loadStructureFromInputs();
}

function setSearchStatus(text) {
  sEls.status.textContent = text;
}

function setSearchMeta({ structure = '-', step = 0, node = '-', frontier = '-', visited = '-' }) {
  sEls.metaStructure.textContent = structure;
  sEls.stepCount.textContent = step;
  sEls.metaNode.textContent = node;
  sEls.metaFrontier.textContent = frontier;
  sEls.metaVisited.textContent = visited;
}

function clearSearchLog() {
  sEls.log.innerHTML = '';
}

function addSearchLog(message) {
  const item = document.createElement('div');
  item.className = 'log-item';
  item.textContent = message;
  sEls.log.appendChild(item);
}

function highlightActiveSearchLog() {
  const items = [...sEls.log.querySelectorAll('.log-item')];
  items.forEach(el => el.classList.remove('active'));
  if (items[searchIndex - 1]) items[searchIndex - 1].classList.add('active');
}

function normalizeValue(v) {
  return String(v ?? '').trim();
}

function parseTreeInput(input) {
  const values = input.split(',').map(v => v.trim()).filter(v => v.length > 0);
  if (!values.length) throw new Error('Enter at least one tree node.');
  const nodes = values.map((value, index) => ({
    id: value,
    raw: value,
    index,
    nullish: /^(null|none|empty)$/i.test(value)
  }));
  const realNodes = nodes.filter(n => !n.nullish);
  if (!realNodes.length) throw new Error('The tree needs at least one real node.');
  const ids = new Set();
  realNodes.forEach(n => {
    if (ids.has(n.id)) throw new Error('Tree node values must be unique for visualization.');
    ids.add(n.id);
  });

  const positions = {};
  const edges = [];
  const adjacency = {};
  realNodes.forEach(n => adjacency[n.id] = []);

  const maxLevel = Math.floor(Math.log2(nodes.length || 1));
  const width = 900;
  const levelGap = 110;
  realNodes.forEach(n => {
    const level = Math.floor(Math.log2(n.index + 1));
    const firstInLevel = 2 ** level - 1;
    const posInLevel = n.index - firstInLevel;
    const slots = 2 ** level;
    positions[n.id] = {
      x: ((posInLevel + 0.5) / slots) * width,
      y: 70 + level * levelGap
    };
  });

  nodes.forEach(n => {
    if (n.nullish) return;
    const left = nodes[2 * n.index + 1];
    const right = nodes[2 * n.index + 2];
    [left, right].forEach(child => {
      if (child && !child.nullish) {
        edges.push([n.id, child.id]);
        adjacency[n.id].push(child.id);
      }
    });
  });

  return {
    kind: 'tree',
    nodes: realNodes.map(n => n.id),
    adjacency,
    edges,
    positions,
    root: realNodes[0].id,
    sourceText: input
  };
}

function parseGraphInput(input) {
  const parts = input.split(',').map(v => v.trim()).filter(Boolean);
  if (!parts.length) throw new Error('Enter at least one graph edge.');
  const adjacency = {};
  const edges = [];
  const set = new Set();

  parts.forEach(part => {
    const cleaned = part.replace(/\s+/g, '');
    const splitter = cleaned.includes('-') ? '-' : cleaned.includes('>') ? '>' : null;
    if (!splitter) throw new Error('Use edges like A-B, A-C, B-D.');
    const [a, b] = cleaned.split(splitter);
    if (!a || !b) throw new Error('Each edge needs two node names.');
    [a, b].forEach(id => {
      if (!adjacency[id]) adjacency[id] = [];
    });
    adjacency[a].push(b);
    adjacency[b].push(a);
    const edgeKey = [a, b].sort().join('|');
    if (!set.has(edgeKey)) {
      set.add(edgeKey);
      edges.push([a, b]);
    }
  });

  const nodes = Object.keys(adjacency).sort();
  const total = nodes.length;
  const positions = {};
  const radius = Math.max(150, 44 * total);
  const centerX = 450;
  const centerY = 220;
  nodes.forEach((id, index) => {
    const angle = (-Math.PI / 2) + (2 * Math.PI * index / total);
    positions[id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
    adjacency[id].sort();
  });

  return {
    kind: 'graph',
    nodes,
    adjacency,
    edges,
    positions,
    root: nodes[0],
    sourceText: input
  };
}

function loadStructureFromInputs() {
  try {
    structureState = sEls.type.value === 'tree'
      ? parseTreeInput(sEls.treeInput.value)
      : parseGraphInput(sEls.graphInput.value);

    renderStructure();
    clearSearchLog();
    searchSteps = [];
    searchIndex = 0;
    uiState = {
      start: normalizeValue(sEls.start.value) || structureState.root,
      target: normalizeValue(sEls.target.value),
      current: null,
      frontier: [],
      visited: [],
      found: false
    };
    renderStructure();
    setSearchStatus(`${capitalize(structureState.kind)} loaded. Choose BFS or DFS, then click Prepare Search.`);
    setSearchMeta({
      structure: `${capitalize(structureState.kind)} · ${structureState.nodes.length} nodes`,
      step: 0,
      node: '-',
      frontier: '-',
      visited: '-'
    });
    sEls.nextBtn.disabled = true;
    sEls.autoBtn.disabled = true;
  } catch (error) {
    setSearchStatus(error.message);
    sEls.viz.innerHTML = '<div class="empty-state">Unable to draw this structure. Check the input format.</div>';
  }
}

function renderStructure() {
  if (!structureState) return;
  const svgLines = structureState.edges.map(([a, b]) => {
    const p1 = structureState.positions[a];
    const p2 = structureState.positions[b];
    return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="viz-edge" />`;
  }).join('');

  const nodeHtml = structureState.nodes.map(id => {
    const pos = structureState.positions[id];
    const classes = ['viz-node'];
    if (uiState.start === id) classes.push('start');
    if (uiState.target === id) classes.push('target');
    if (uiState.frontier.includes(id)) classes.push('frontier');
    if (uiState.visited.includes(id)) classes.push(uiState.found && id === uiState.target ? 'found' : 'visited');
    if (uiState.current === id) classes.push('current');
    return `<div class="${classes.join(' ')}" style="left:${pos.x}px;top:${pos.y}px;">${id}</div>`;
  }).join('');

  sEls.viz.innerHTML = `
    <svg class="viz-svg" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet">${svgLines}</svg>
    ${nodeHtml}
  `;
}

function prepareSearch() {
  if (playingSearch || !structureState) return;
  const start = normalizeValue(sEls.start.value) || structureState.root;
  const target = normalizeValue(sEls.target.value);
  if (!structureState.nodes.includes(start)) {
    setSearchStatus(`Start node "${start}" does not exist in this ${structureState.kind}.`);
    return;
  }
  if (!target) {
    setSearchStatus('Enter a target node to search for.');
    return;
  }
  if (!structureState.nodes.includes(target)) {
    setSearchStatus(`Target node "${target}" does not exist in this ${structureState.kind}.`);
    return;
  }

  uiState = { start, target, current: null, frontier: [], visited: [], found: false };
  renderStructure();
  clearSearchLog();
  searchSteps = buildSearchSteps(structureState, sEls.search.value, start, target);
  searchIndex = 0;
  searchSteps.forEach(step => addSearchLog(step.message));
  setSearchStatus(`${sEls.search.value.toUpperCase()} prepared. Use Next Step or Auto Play.`);
  setSearchMeta({ structure: `${capitalize(structureState.kind)} · ${sEls.search.value.toUpperCase()}`, step: 0, node: '-', frontier: '-', visited: '-' });
  sEls.nextBtn.disabled = false;
  sEls.autoBtn.disabled = false;
}

function buildSearchSteps(structure, method, start, target) {
  const steps = [];
  const visited = new Set();
  const frontier = [start];
  steps.push({
    type: 'init',
    structure: structure.kind,
    current: null,
    frontier: [...frontier],
    visited: [],
    found: false,
    message: `${method.toUpperCase()} starts at node ${start} and searches for ${target}.`
  });

  while (frontier.length) {
    const current = method === 'bfs' ? frontier.shift() : frontier.pop();
    steps.push({
      type: 'select',
      structure: structure.kind,
      current,
      frontier: [...frontier],
      visited: [...visited],
      found: false,
      message: `${method.toUpperCase()} selects ${current} from the ${method === 'bfs' ? 'frontier queue' : 'frontier stack'}.`
    });

    if (visited.has(current)) {
      steps.push({
        type: 'skip', structure: structure.kind, current, frontier: [...frontier], visited: [...visited], found: false,
        message: `${current} was already visited, so skip it.`
      });
      continue;
    }

    visited.add(current);
    const found = current === target;
    steps.push({
      type: found ? 'found' : 'visit',
      structure: structure.kind,
      current,
      frontier: [...frontier],
      visited: [...visited],
      found,
      message: found ? `Target ${target} found at node ${current}.` : `Visit ${current}. It is not the target, so continue.`
    });
    if (found) break;

    const neighbors = [...(structure.adjacency[current] || [])].filter(n => !visited.has(n));
    const ordered = method === 'bfs' ? neighbors : [...neighbors].reverse();
    ordered.forEach(n => frontier.push(n));
    steps.push({
      type: 'expand',
      structure: structure.kind,
      current,
      frontier: [...frontier],
      visited: [...visited],
      found: false,
      message: ordered.length
        ? `${method.toUpperCase()} adds ${ordered.join(', ')} to the ${method === 'bfs' ? 'queue' : 'stack'}.`
        : `${current} has no new unvisited neighbors to add.`
    });
  }

  if (![...visited].includes(target)) {
    steps.push({
      type: 'done',
      structure: structure.kind,
      current: null,
      frontier: [],
      visited: [...visited],
      found: false,
      message: `${method.toUpperCase()} finished. Target ${target} was not found.`
    });
  }

  return steps;
}

async function runSearchStep(step) {
  uiState.current = step.current || null;
  uiState.frontier = [...step.frontier];
  uiState.visited = [...step.visited];
  uiState.found = !!step.found;
  renderStructure();
  setSearchStatus(step.message);
  setSearchMeta({
    structure: `${capitalize(step.structure)} · ${sEls.search.value.toUpperCase()}`,
    step: searchIndex,
    node: step.current || '-',
    frontier: step.frontier.length ? step.frontier.join(', ') : '-',
    visited: step.visited.length ? step.visited.join(', ') : '-'
  });
  await sleep(560);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function nextSearchStep() {
  if (playingSearch || searchIndex >= searchSteps.length) return;
  const step = searchSteps[searchIndex++];
  await runSearchStep(step);
  highlightActiveSearchLog();
  if (searchIndex >= searchSteps.length) {
    sEls.nextBtn.disabled = true;
    sEls.autoBtn.disabled = true;
  }
}

async function autoPlaySearch() {
  if (playingSearch || searchIndex >= searchSteps.length) return;
  playingSearch = true;
  sEls.nextBtn.disabled = true;
  sEls.autoBtn.disabled = true;
  while (searchIndex < searchSteps.length) {
    const step = searchSteps[searchIndex++];
    await runSearchStep(step);
    highlightActiveSearchLog();
    await sleep(220);
  }
  playingSearch = false;
}

function resetSearchVisualizer() {
  playingSearch = false;
  searchSteps = [];
  searchIndex = 0;
  uiState = {
    start: normalizeValue(sEls.start.value) || structureState?.root || null,
    target: normalizeValue(sEls.target.value),
    current: null,
    frontier: [],
    visited: [],
    found: false
  };
  renderStructure();
  clearSearchLog();
  setSearchStatus('Visualizer reset. Choose a structure and search method, then click Prepare Search.');
  setSearchMeta({
    structure: structureState ? `${capitalize(structureState.kind)} · ${structureState.nodes.length} nodes` : '-',
    step: 0,
    node: '-',
    frontier: '-',
    visited: '-'
  });
  sEls.nextBtn.disabled = true;
  sEls.autoBtn.disabled = true;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
