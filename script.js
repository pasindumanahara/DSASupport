const PRESETS = {
  original: [1, 2, 3, 4, 5, 6],
  reverse: [6, 5, 4, 3, 2, 1],
  custom: [3, 1, 6, 2, 5, 4]
};

const els = {
  container: document.getElementById('ball-container'),
  status: document.getElementById('status'),
  arrayView: document.getElementById('arrayView'),
  stepCount: document.getElementById('stepCount'),
  metaA: document.getElementById('metaA'),
  metaB: document.getElementById('metaB'),
  metaC: document.getElementById('metaC'),
  log: document.getElementById('log'),
  algorithm: document.getElementById('algorithmSelect'),
  preset: document.getElementById('presetSelect'),
  arrayInput: document.getElementById('arrayInput'),
  nextBtn: document.getElementById('nextBtn'),
  autoBtn: document.getElementById('autoBtn'),
  loadBtn: document.getElementById('loadBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  prepareBtn: document.getElementById('prepareBtn'),
  resetBtn: document.getElementById('resetBtn')
};

let currentOrder = [...PRESETS.custom];
let steps = [];
let stepIndex = 0;
let playing = false;
let fullySorted = false;

if (els.container) {
  bindUI();
  renderBalls(currentOrder);
  updateArrayView();
}

function bindUI() {
  els.preset.addEventListener('change', () => {
    const preset = PRESETS[els.preset.value];
    if (preset) els.arrayInput.value = preset.join(',');
  });

  els.loadBtn.addEventListener('click', () => {
    const values = parseInputArray();
    if (!values) return;
    loadOrder(values);
  });

  els.shuffleBtn.addEventListener('click', shuffleBalls);
  els.prepareBtn.addEventListener('click', prepareSelectedSort);
  els.nextBtn.addEventListener('click', nextStep);
  els.autoBtn.addEventListener('click', autoPlay);
  els.resetBtn.addEventListener('click', resetVisualizer);
}

function parseInputArray() {
  const raw = els.arrayInput.value.trim();
  if (!raw) {
    alert('Enter numbers separated by commas.');
    return null;
  }
  const values = raw.split(',').map(v => Number(v.trim()));
  if (values.some(Number.isNaN)) {
    alert('Only numbers separated by commas are allowed.');
    return null;
  }
  return values;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function renderBalls(order) {
  els.container.innerHTML = '';
  order.forEach(num => {
    const ball = document.createElement('div');
    ball.className = 'ball';
    if (fullySorted) ball.classList.add('sorted');
    ball.textContent = num;
    els.container.appendChild(ball);
  });
}

function getBalls() { return [...els.container.children]; }
function updateArrayView() { els.arrayView.textContent = `[${currentOrder.join(', ')}]`; }
function setStatus(text) { els.status.textContent = text; }
function setMeta(a='-', b='-', c='-', count=0) {
  els.metaA.textContent = a;
  els.metaB.textContent = b;
  els.metaC.textContent = c;
  els.stepCount.textContent = count;
}
function clearLog() { els.log.innerHTML = ''; }
function addLog(message) {
  const item = document.createElement('div');
  item.className = 'log-item';
  item.textContent = message;
  els.log.appendChild(item);
}
function highlightActiveLog() {
  const items = [...els.log.querySelectorAll('.log-item')];
  items.forEach(i => i.classList.remove('active'));
  if (items[stepIndex - 1]) items[stepIndex - 1].classList.add('active');
}
function clearClasses() {
  getBalls().forEach(ball => {
    ball.className = 'ball';
    if (fullySorted) ball.classList.add('sorted');
    ball.style.transform = '';
  });
}

function loadOrder(order) {
  if (playing) return;
  currentOrder = [...order];
  steps = [];
  stepIndex = 0;
  fullySorted = false;
  renderBalls(currentOrder);
  clearClasses();
  clearLog();
  updateArrayView();
  setStatus('New order loaded. Choose an algorithm and click Prepare Sort.');
  setMeta('-', '-', '-', 0);
  els.nextBtn.disabled = true;
  els.autoBtn.disabled = true;
}

function shuffleBalls() {
  if (playing) return;
  const shuffled = [...currentOrder].sort(() => Math.random() - 0.5);
  els.arrayInput.value = shuffled.join(',');
  loadOrder(shuffled);
}

function animateReorder(newOrder) {
  const oldBalls = getBalls();
  const oldPositions = oldBalls.map(ball => ball.getBoundingClientRect());
  renderBalls(newOrder);
  const newBalls = getBalls();
  newBalls.forEach((ball, index) => {
    const oldPos = oldPositions[index];
    const newPos = ball.getBoundingClientRect();
    if (!oldPos || !newPos) return;
    ball.style.transform = `translate(${oldPos.left - newPos.left}px, ${oldPos.top - newPos.top}px)`;
  });
  requestAnimationFrame(() => newBalls.forEach(ball => (ball.style.transform = 'translate(0, 0)')));
  updateArrayView();
}

function mark(indices = {}, classes = {}) {
  clearClasses();
  const balls = getBalls();
  Object.entries(indices).forEach(([cls, vals]) => {
    (Array.isArray(vals) ? vals : [vals]).forEach(idx => {
      if (idx !== null && idx !== undefined && balls[idx]) balls[idx].classList.add(cls);
    });
  });
  if (classes.dimOthers) {
    balls.forEach((ball, idx) => {
      if (!classes.keep.has(idx)) ball.classList.add('dimmed');
    });
  }
}

function prepareSelectedSort() {
  if (playing) return;
  fullySorted = false;
  clearClasses();
  clearLog();
  const algorithm = els.algorithm.value;
  steps = generateSteps(algorithm, currentOrder);
  stepIndex = 0;
  steps.forEach(step => addLog(step.message));
  setStatus(`${getAlgoName(algorithm)} prepared. Use Next Step or Auto Play.`);
  setMeta('-', '-', '-', 0);
  els.nextBtn.disabled = false;
  els.autoBtn.disabled = false;
}

function getAlgoName(key) {
  return {
    bubble: 'Bubble Sort', merge: 'Merge Sort', insertion: 'Insertion Sort',
    quick: 'Quick Sort', selection: 'Selection Sort', shell: 'Shell Sort'
  }[key];
}

function generateSteps(algorithm, arr) {
  switch (algorithm) {
    case 'bubble': return bubbleSteps(arr);
    case 'merge': return mergeSteps(arr);
    case 'insertion': return insertionSteps(arr);
    case 'quick': return quickSteps(arr);
    case 'selection': return selectionSteps(arr);
    case 'shell': return shellSteps(arr);
    default: return [];
  }
}

function bubbleSteps(arr) {
  const a = [...arr], s = [];
  for (let pass = 0; pass < a.length - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - pass; j++) {
      s.push({type:'compare', algo:'bubble', i:j, j:j+1, pass:pass+1, message:`Pass ${pass+1}: compare ${a[j]} and ${a[j+1]}.`});
      if (a[j] > a[j+1]) {
        s.push({type:'swap', algo:'bubble', i:j, j:j+1, message:`${a[j]} > ${a[j+1]}, so swap them.`});
        [a[j], a[j+1]] = [a[j+1], a[j]];
        swapped = true;
        s.push({type:'state', algo:'bubble', message:`Array after swap: [${a.join(', ')}].`, array:[...a]});
      } else {
        s.push({type:'noswap', algo:'bubble', i:j, j:j+1, message:`${a[j]} <= ${a[j+1]}, so no swap is needed.`});
      }
    }
    s.push({type:'markSorted', algo:'bubble', index:a.length-1-pass, message:`${a[a.length-1-pass]} is now fixed in sorted position.`});
    if (!swapped) break;
  }
  s.push({type:'done', algo:'bubble', array:[...a], message:`Bubble Sort complete. Final sorted array: [${a.join(', ')}].`});
  return s;
}

function mergeSteps(arr) {
  const a = [...arr], s = [];
  function sort(l, r) {
    if (l >= r) {
      s.push({type:'single', algo:'merge', l, r, message:`Single element at index ${l}.`});
      return;
    }
    const m = Math.floor((l + r) / 2);
    s.push({type:'split', algo:'merge', l, m, r, message:`Split range [${l}..${r}] into [${l}..${m}] and [${m+1}..${r}].`});
    sort(l, m); sort(m+1, r); merge(l, m, r);
  }
  function merge(l, m, r) {
    const left = a.slice(l, m+1), right = a.slice(m+1, r+1);
    s.push({type:'startMerge', algo:'merge', l, m, r, message:`Start merging [${left.join(', ')}] and [${right.join(', ')}].`});
    let i=0,j=0,k=l;
    while (i < left.length && j < right.length) {
      s.push({type:'compare', algo:'merge', l, m, r, i:l+i, j:m+1+j, message:`Compare ${left[i]} and ${right[j]}.`});
      if (left[i] <= right[j]) {
        a[k] = left[i];
        s.push({type:'write', algo:'merge', l, m, r, writeIndex:k, source:'left', message:`Write ${left[i]} into index ${k}.`, array:[...a]});
        i++;
      } else {
        a[k] = right[j];
        s.push({type:'write', algo:'merge', l, m, r, writeIndex:k, source:'right', message:`Write ${right[j]} into index ${k}.`, array:[...a]});
        j++;
      }
      k++;
    }
    while (i < left.length) {
      a[k] = left[i];
      s.push({type:'write', algo:'merge', l, m, r, writeIndex:k, source:'left', message:`Copy remaining left value ${left[i]} into index ${k}.`, array:[...a]});
      i++; k++;
    }
    while (j < right.length) {
      a[k] = right[j];
      s.push({type:'write', algo:'merge', l, m, r, writeIndex:k, source:'right', message:`Copy remaining right value ${right[j]} into index ${k}.`, array:[...a]});
      j++; k++;
    }
    s.push({type:'merged', algo:'merge', l, r, message:`Range [${l}..${r}] is now merged: [${a.slice(l, r+1).join(', ')}].`});
  }
  sort(0, a.length-1);
  s.push({type:'done', algo:'merge', array:[...a], message:`Merge Sort complete. Final sorted array: [${a.join(', ')}].`});
  return s;
}

function insertionSteps(arr) {
  const a = [...arr], s = [];
  for (let i=1;i<a.length;i++) {
    const key = a[i]; let j = i-1;
    s.push({type:'selectKey', algo:'insertion', i, key, message:`Pick ${key} at index ${i} as the key.`});
    while (j >= 0) {
      s.push({type:'compare', algo:'insertion', i, j, key, message:`Compare key ${key} with ${a[j]} at index ${j}.`});
      if (a[j] > key) {
        s.push({type:'shift', algo:'insertion', from:j, to:j+1, i, j, key, message:`Shift ${a[j]} one position to the right.`});
        a[j+1] = a[j];
        s.push({type:'state', algo:'insertion', i, key, message:`Array after shifting: [${a.join(', ')}].`, array:[...a]});
        j--;
      } else {
        s.push({type:'stop', algo:'insertion', i, j, key, message:`${a[j]} is not greater than ${key}, so stop shifting.`});
        break;
      }
    }
    a[j+1] = key;
    s.push({type:'insert', algo:'insertion', i, insertIndex:j+1, key, message:`Insert key ${key} into index ${j+1}.`, array:[...a]});
  }
  s.push({type:'done', algo:'insertion', array:[...a], message:`Insertion Sort complete. Final sorted array: [${a.join(', ')}].`});
  return s;
}

function quickSteps(arr) {
  const a = [...arr], s = [];
  function qs(low, high) {
    if (low > high) return;
    if (low === high) {
      s.push({type:'single', algo:'quick', low, high, index:low, message:`Single element ${a[low]} at index ${low}.`});
      return;
    }
    const p = partition(low, high);
    qs(low, p-1); qs(p+1, high);
  }
  function partition(low, high) {
    const pivot = a[high];
    let i = low - 1;
    s.push({type:'choosePivot', algo:'quick', low, high, pivotIndex:high, pivotValue:pivot, message:`Choose ${pivot} at index ${high} as the pivot.`});
    for (let j=low;j<high;j++) {
      s.push({type:'compare', algo:'quick', low, high, pivotIndex:high, pivotValue:pivot, compareIndex:j, pointerIndex:i, message:`Compare ${a[j]} with pivot ${pivot}.`});
      if (a[j] < pivot) {
        i++;
        if (i !== j) {
          s.push({type:'swap', algo:'quick', low, high, pivotIndex:high, i, j, message:`${a[j]} is smaller than pivot, so swap indices ${i} and ${j}.`});
          [a[i], a[j]] = [a[j], a[i]];
          s.push({type:'state', algo:'quick', low, high, message:`Array after swap: [${a.join(', ')}].`, array:[...a], i, j});
        } else {
          s.push({type:'movePointer', algo:'quick', low, high, i, j, pivotIndex:high, message:`${a[j]} belongs on the left side, so the boundary moves to ${i}.`});
        }
      } else {
        s.push({type:'noswap', algo:'quick', low, high, i, j, pivotIndex:high, message:`${a[j]} stays on the right side for now.`});
      }
    }
    s.push({type:'finalPivotSwap', algo:'quick', low, high, from:high, to:i+1, message:`Place pivot ${pivot} into final position ${i+1}.`});
    [a[i+1], a[high]] = [a[high], a[i+1]];
    s.push({type:'pivotFixed', algo:'quick', low, high, fixedIndex:i+1, array:[...a], message:`Pivot ${pivot} is now fixed at index ${i+1}.`});
    return i + 1;
  }
  qs(0, a.length-1);
  s.push({type:'done', algo:'quick', array:[...a], message:`Quick Sort complete. Final sorted array: [${a.join(', ')}].`});
  return s;
}

function selectionSteps(arr) {
  const a = [...arr], s = [];
  for (let i=0;i<a.length-1;i++) {
    let minIndex = i;
    s.push({type:'startPass', algo:'selection', i, minIndex, message:`Start pass ${i+1}. Assume index ${i} is the current minimum.`});
    for (let j=i+1;j<a.length;j++) {
      s.push({type:'compare', algo:'selection', i, minIndex, j, message:`Compare current minimum ${a[minIndex]} with ${a[j]}.`});
      if (a[j] < a[minIndex]) {
        minIndex = j;
        s.push({type:'newMin', algo:'selection', i, minIndex, j, message:`${a[j]} is smaller, so index ${j} becomes the new minimum.`});
      } else {
        s.push({type:'keepMin', algo:'selection', i, minIndex, j, message:`Current minimum stays at index ${minIndex}.`});
      }
    }
    if (minIndex !== i) {
      s.push({type:'swap', algo:'selection', i, minIndex, message:`Swap index ${i} with minimum index ${minIndex}.`});
      [a[i], a[minIndex]] = [a[minIndex], a[i]];
      s.push({type:'state', algo:'selection', i, minIndex, message:`Array after swap: [${a.join(', ')}].`, array:[...a]});
    } else {
      s.push({type:'noswap', algo:'selection', i, minIndex, message:`Minimum is already at index ${i}, so no swap is needed.`});
    }
    s.push({type:'fixed', algo:'selection', i, message:`Index ${i} is now fixed in sorted order.`});
  }
  s.push({type:'done', algo:'selection', array:[...a], message:`Selection Sort complete. Final sorted array: [${a.join(', ')}].`});
  return s;
}

function shellSteps(arr) {
  const a = [...arr], s = [];
  for (let gap = Math.floor(a.length/2); gap > 0; gap = Math.floor(gap/2)) {
    s.push({type:'startGap', algo:'shell', gap, message:`Start a new gap pass with gap = ${gap}.`});
    for (let i=gap;i<a.length;i++) {
      const key = a[i]; let j=i;
      s.push({type:'selectKey', algo:'shell', gap, i, key, baseIndex:i%gap, message:`Pick ${key} at index ${i} as the key for gap ${gap}.`});
      while (j >= gap) {
        s.push({type:'compare', algo:'shell', gap, i, j, compareIndex:j-gap, key, baseIndex:i%gap, message:`Compare key ${key} with ${a[j-gap]} using gap ${gap}.`});
        if (a[j-gap] > key) {
          s.push({type:'shift', algo:'shell', gap, i, from:j-gap, to:j, key, baseIndex:i%gap, message:`Shift ${a[j-gap]} from ${j-gap} to ${j}.`});
          a[j] = a[j-gap];
          s.push({type:'state', algo:'shell', gap, i, key, baseIndex:i%gap, message:`Array after shifting: [${a.join(', ')}].`, array:[...a]});
          j -= gap;
        } else {
          s.push({type:'stop', algo:'shell', gap, i, j, compareIndex:j-gap, key, baseIndex:i%gap, message:`Stop shifting in this gap group.`});
          break;
        }
      }
      a[j] = key;
      s.push({type:'insert', algo:'shell', gap, i, insertIndex:j, key, baseIndex:i%gap, message:`Insert key ${key} into index ${j}.`, array:[...a]});
    }
    s.push({type:'gapDone', algo:'shell', gap, message:`Gap ${gap} pass finished. Current array: [${a.join(', ')}].`});
  }
  s.push({type:'done', algo:'shell', array:[...a], message:`Shell Sort complete. Final sorted array: [${a.join(', ')}].`});
  return s;
}

async function runStep(step) {
  setStatus(step.message);
  setMeta(stepMeta(step).a, stepMeta(step).b, stepMeta(step).c, stepIndex);
  switch (step.algo) {
    case 'bubble': return runBubble(step);
    case 'merge': return runMerge(step);
    case 'insertion': return runInsertion(step);
    case 'quick': return runQuick(step);
    case 'selection': return runSelection(step);
    case 'shell': return runShell(step);
  }
}

function stepMeta(step) {
  const maps = {
    bubble: {a:`Pass ${step.pass ?? '-'}`, b: step.i ?? '-', c: step.j ?? '-'},
    merge: {a: step.l !== undefined ? `${step.l}..${step.r}` : '-', b: step.m ?? '-', c: step.writeIndex ?? (step.i !== undefined ? `${step.i}, ${step.j}` : '-')},
    insertion: {a: `Key ${step.key ?? '-'}`, b: step.i ?? '-', c: step.j ?? step.insertIndex ?? '-'},
    quick: {a: step.low !== undefined ? `${step.low}..${step.high}` : '-', b: step.pivotValue ?? step.pivotIndex ?? '-', c: step.compareIndex ?? step.fixedIndex ?? step.i ?? step.j ?? '-'},
    selection: {a: step.i ?? '-', b: step.minIndex ?? '-', c: step.j ?? '-'},
    shell: {a: `Gap ${step.gap ?? '-'}`, b: step.i ?? '-', c: step.compareIndex ?? step.insertIndex ?? '-'}
  };
  return maps[step.algo] || {a:'-', b:'-', c:'-'};
}

async function runBubble(step) {
  if (step.type === 'compare' || step.type === 'noswap') mark({comparing:[step.i, step.j]}, {});
  if (step.type === 'swap') {
    mark({swapping:[step.i, step.j]}, {});
    await sleep(320);
    const next = [...currentOrder]; [next[step.i], next[step.j]] = [next[step.j], next[step.i]]; currentOrder = next; animateReorder(currentOrder);
  }
  if (step.type === 'state') { currentOrder = [...step.array]; updateArrayView(); }
  if (step.type === 'markSorted') mark({sorted: step.index}, {});
  if (step.type === 'done') { fullySorted = true; currentOrder = [...step.array]; renderBalls(currentOrder); }
  await sleep(520);
}

async function runMerge(step) {
  if (step.type === 'split' || step.type === 'startMerge') mark({left: range(step.l, step.m), right: range(step.m + 1, step.r)}, {});
  if (step.type === 'single') mark({range: step.index ?? step.l}, {});
  if (step.type === 'compare') mark({left: step.i, right: step.j, comparing:[step.i, step.j]}, {});
  if (step.type === 'write') {
    currentOrder = [...step.array]; animateReorder(currentOrder); mark({writing: step.writeIndex, left: step.source === 'left' ? step.writeIndex : null, right: step.source === 'right' ? step.writeIndex : null}, {});
  }
  if (step.type === 'merged') mark({range: range(step.l, step.r)}, {});
  if (step.type === 'done') { fullySorted = true; currentOrder = [...step.array]; renderBalls(currentOrder); }
  await sleep(560);
}

async function runInsertion(step) {
  if (step.type === 'selectKey') mark({ 'sorted-part': range(0, step.i - 1), key: step.i }, {});
  if (step.type === 'compare' || step.type === 'stop') mark({ 'sorted-part': range(0, step.i - 1), key: step.i, comparing: step.j }, {});
  if (step.type === 'shift') {
    mark({ 'sorted-part': range(0, step.i - 1), key: step.i, shifting: step.from }, {});
    await sleep(320);
    const next = [...currentOrder]; next[step.to] = next[step.from]; currentOrder = next; animateReorder(currentOrder);
  }
  if (step.type === 'state') { currentOrder = [...step.array]; updateArrayView(); }
  if (step.type === 'insert') { currentOrder = [...step.array]; animateReorder(currentOrder); mark({ 'sorted-part': range(0, step.i), inserted: step.insertIndex }, {}); }
  if (step.type === 'done') { fullySorted = true; currentOrder = [...step.array]; renderBalls(currentOrder); }
  await sleep(560);
}

async function runQuick(step) {
  if (step.type === 'single') mark({sorted: step.index}, {});
  if (step.type === 'choosePivot') mark({range: range(step.low, step.high), pivot: step.pivotIndex}, {});
  if (step.type === 'compare' || step.type === 'movePointer' || step.type === 'noswap') mark({range: range(step.low, step.high), pivot: step.pivotIndex, comparing: step.compareIndex ?? step.j, pointer: step.pointerIndex >= step.low ? step.pointerIndex : step.i}, {});
  if (step.type === 'swap') {
    mark({range: range(step.low, step.high), pivot: step.pivotIndex, swapping:[step.i, step.j]}, {});
    await sleep(320);
    const next = [...currentOrder]; [next[step.i], next[step.j]] = [next[step.j], next[step.i]]; currentOrder = next; animateReorder(currentOrder);
  }
  if (step.type === 'finalPivotSwap') {
    mark({range: range(step.low, step.high), swapping:[step.from, step.to]}, {});
    await sleep(320);
    const next = [...currentOrder]; [next[step.to], next[step.from]] = [next[step.from], next[step.to]]; currentOrder = next; animateReorder(currentOrder);
  }
  if (step.type === 'state') { currentOrder = [...step.array]; updateArrayView(); }
  if (step.type === 'pivotFixed') { currentOrder = [...step.array]; animateReorder(currentOrder); mark({range: range(step.low, step.high), 'pivot-fixed': step.fixedIndex}, {}); }
  if (step.type === 'done') { fullySorted = true; currentOrder = [...step.array]; renderBalls(currentOrder); }
  await sleep(560);
}

async function runSelection(step) {
  if (step.type === 'startPass' || step.type === 'keepMin' || step.type === 'newMin' || step.type === 'noswap') mark({sorted: range(0, step.i - 1), current: step.i, min: step.minIndex, comparing: step.j}, {});
  if (step.type === 'compare') mark({sorted: range(0, step.i - 1), current: step.i, min: step.minIndex, comparing: step.j}, {});
  if (step.type === 'swap') {
    mark({sorted: range(0, step.i - 1), swapping:[step.i, step.minIndex]}, {});
    await sleep(320);
    const next = [...currentOrder]; [next[step.i], next[step.minIndex]] = [next[step.minIndex], next[step.i]]; currentOrder = next; animateReorder(currentOrder);
  }
  if (step.type === 'state') { currentOrder = [...step.array]; updateArrayView(); }
  if (step.type === 'fixed') mark({sorted: range(0, step.i - 1), fixed: step.i}, {});
  if (step.type === 'done') { fullySorted = true; currentOrder = [...step.array]; renderBalls(currentOrder); }
  await sleep(560);
}

async function runShell(step) {
  const group = step.baseIndex !== undefined && step.gap ? gapGroup(step.baseIndex, step.gap, currentOrder.length) : [];
  if (step.type === 'startGap' || step.type === 'gapDone') clearClasses();
  if (step.type === 'selectKey') mark({group, key: step.i}, {dimOthers:true, keep:new Set(group)});
  if (step.type === 'compare' || step.type === 'stop') mark({group, key: step.i, comparing: step.compareIndex}, {dimOthers:true, keep:new Set([...group, step.compareIndex, step.i])});
  if (step.type === 'shift') {
    mark({group, key: step.i, shifting: step.from}, {dimOthers:true, keep:new Set([...group, step.i, step.from])});
    await sleep(320);
    const next = [...currentOrder]; next[step.to] = next[step.from]; currentOrder = next; animateReorder(currentOrder);
  }
  if (step.type === 'state') { currentOrder = [...step.array]; updateArrayView(); }
  if (step.type === 'insert') { currentOrder = [...step.array]; animateReorder(currentOrder); mark({group, inserted: step.insertIndex}, {dimOthers:true, keep:new Set([...group, step.insertIndex])}); }
  if (step.type === 'done') { fullySorted = true; currentOrder = [...step.array]; renderBalls(currentOrder); }
  await sleep(560);
}

function range(start, end) {
  if (start === undefined || end === undefined || end < start) return [];
  return Array.from({length: end - start + 1}, (_, i) => start + i);
}
function gapGroup(base, gap, length) {
  const out = [];
  for (let i = base; i < length; i += gap) out.push(i);
  return out;
}

async function nextStep() {
  if (playing || stepIndex >= steps.length) return;
  const step = steps[stepIndex++];
  await runStep(step);
  highlightActiveLog();
  if (stepIndex >= steps.length) { els.nextBtn.disabled = true; els.autoBtn.disabled = true; }
}

async function autoPlay() {
  if (playing || stepIndex >= steps.length) return;
  playing = true;
  els.nextBtn.disabled = true;
  els.autoBtn.disabled = true;
  while (stepIndex < steps.length) {
    const step = steps[stepIndex++];
    await runStep(step);
    highlightActiveLog();
    await sleep(220);
  }
  playing = false;
}

function resetVisualizer() {
  playing = false;
  steps = [];
  stepIndex = 0;
  fullySorted = false;
  renderBalls(currentOrder);
  clearClasses();
  clearLog();
  setStatus('Visualizer reset. Load an array, choose an algorithm, then click Prepare Sort.');
  setMeta('-', '-', '-', 0);
  els.nextBtn.disabled = true;
  els.autoBtn.disabled = true;
}
