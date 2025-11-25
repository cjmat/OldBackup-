// Entire contents of the former inline <script> block migrated here without changes.
// ...existing code migrated from index.html...

// --- BACKGROUND COLOR CHANGE HANDLER ---
if (window.require) {
  try {
    const { ipcRenderer } = require('electron');

    ipcRenderer.on('change-background-color', (event, colorHex) => {
      document.body.style.backgroundColor = `#${colorHex}`;
      localStorage.setItem('background-color', colorHex);
      const customBgModal = document.getElementById('customBgModal');
      if (customBgModal && customBgModal.classList.contains('show')) {
        customBgModal.classList.remove('show');
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      const savedColor = localStorage.getItem('background-color');
      if (savedColor) {
        document.body.style.backgroundColor = `#${savedColor}`;
      }
    });
  } catch (error) {
    console.error('Failed to set up IPC communication for background color:', error);
  }
}

// --- MODAL LOGIC ---
const modalBg = document.getElementById('modalBg');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalOkBtn = document.getElementById('modalOkBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
let modalResolve = null;

const measureSpan = document.createElement('span');
measureSpan.style.visibility = 'hidden';
measureSpan.style.position = 'absolute';
measureSpan.style.whiteSpace = 'pre';
measureSpan.style.font = 'inherit';
measureSpan.style.fontSize = '0.75rem';
document.body.appendChild(measureSpan);

// Add: helper to focus an input and place caret at the end immediately (with RAF fallback)
function focusAndPlaceCaretEnd(input) {
  if (!input) return;
  try {
    input.focus();
    const value = input.value || '';
    if (typeof input.setSelectionRange === 'function') {
      input.setSelectionRange(value.length, value.length);
      input.scrollLeft = input.scrollWidth || 0;
    } else {
      // fallback for inputs that don't support setSelectionRange
      input.value = '';
      input.value = value;
    }
    // Some environments may not apply focus/selection immediately; ensure on next frame too
    requestAnimationFrame(() => {
      try {
        input.focus();
        if (typeof input.setSelectionRange === 'function') {
          input.setSelectionRange(value.length, value.length);
          input.scrollLeft = input.scrollWidth || 0;
        }
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }
}

const SIDEBAR_MAX_WIDTH = 410;
const BUTTONS_AND_PADDING = 80;
const INDENT_PER_LEVEL = 15;

function getInputPx(val) {
  measureSpan.style.fontFamily = getComputedStyle(modalInput).fontFamily;
  measureSpan.style.fontSize = getComputedStyle(modalInput).fontSize;
  measureSpan.textContent = val;
  return measureSpan.offsetWidth;
}

function getDepth(parentId) {
  let depth = 0;
  let cur = parentId;
  while (cur && notesData[cur] && notesData[cur].parent) {
    depth++;
    cur = notesData[cur].parent;
  }
  return depth;
}

function closeAllModals() {
  if (modalResolve) {
    closeModal(null);
  } else {
    modalBg.classList.remove('show');
  }

  if (deleteModalResolve) {
    closeDeleteModal(false);
  } else {
    deleteModalBg.classList.remove('show');
  }

  mathSymbolsModalBg.classList.remove('show');
  customBgModal.classList.remove('show');
  customTableModalBg.classList.remove('show');

  selectedSymbolRow = null;
  selectedSymbolCode = null;
  if (mathSymbolsModalInsertBtn) {
    mathSymbolsModalInsertBtn.disabled = true;
    mathSymbolsModalInsertBtn.style.cursor = 'not-allowed';
  }
}

function showModal({ title, initialValue = '', depth = 0 }) {
  closeAllModals();

  const maxPx = SIDEBAR_MAX_WIDTH - BUTTONS_AND_PADDING - (INDENT_PER_LEVEL * depth);
  modalTitle.textContent = title;
  modalInput.value = initialValue;
  modalBg.classList.add('show');
  // Focus immediately (no 100ms timeout)
  focusAndPlaceCaretEnd(modalInput);

  if (modalInput._handler) modalInput.removeEventListener('input', modalInput._handler);

  const handler = () => {
    let val = modalInput.value;
    while (getInputPx(val) > maxPx && val.length > 0) {
      val = val.slice(0, -1);
    }
    if (modalInput.value !== val) {
      modalInput.value = val;
    }
    const disabled = !modalInput.value.trim();
    modalOkBtn.disabled = disabled;
    modalOkBtn.style.cursor = disabled ? 'not-allowed' : '';
  };
  modalInput.addEventListener('input', handler);
  modalInput._handler = handler;

  const disabled = !modalInput.value.trim();
  modalOkBtn.disabled = disabled;
  modalOkBtn.style.cursor = disabled ? 'not-allowed' : '';

  return new Promise((resolve) => { modalResolve = resolve; });
}
function closeModal(result) {
  modalBg.classList.remove('show');
  modalResolve && modalResolve(result);
  modalResolve = null;
}
modalOkBtn.onclick = () => {
  if (modalOkBtn.disabled) return;
  closeModal(modalInput.value.trim());
};
modalCancelBtn.onclick = () => { closeModal(null); };
modalBg.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (document.activeElement === modalCancelBtn) {
      modalCancelBtn.click();
    } else if (!modalOkBtn.disabled) {
      modalOkBtn.click();
    }
  } else if (e.key === 'Escape') {
    modalCancelBtn.click();
  }
});

// --- DELETE MODAL LOGIC ---
const deleteModalBg = document.getElementById('deleteModalBg');
const deleteModalYesBtn = document.getElementById('deleteModalYesBtn');
const deleteModalNoBtn = document.getElementById('deleteModalNoBtn');
const deleteModalTitle = document.getElementById('deleteModalTitle');
let deleteModalResolve = null;
function showDeleteModal(name) {
  closeAllModals();
  deleteModalTitle.textContent = `Are you sure you want to delete "${name}"?`;
  deleteModalBg.classList.add('show');
  return new Promise((resolve) => { deleteModalResolve = resolve; });
}
function closeDeleteModal(result) {
  deleteModalBg.classList.remove('show');
  deleteModalResolve && deleteModalResolve(result);
  deleteModalResolve = null;
}
deleteModalYesBtn.onclick = () => closeDeleteModal(true);
deleteModalNoBtn.onclick = () => closeDeleteModal(false);
deleteModalBg.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (document.activeElement === deleteModalNoBtn) {
      deleteModalNoBtn.click();
    } else {
      deleteModalYesBtn.click();
    }
  } else if (e.key === 'Escape') {
    deleteModalNoBtn.click();
  }
});

// --- MATH SYMBOLS MODAL LOGIC ---
const mathSymbolsModalBg = document.getElementById('mathSymbolsModalBg');
const mathSymbolsModalCancelBtn = document.getElementById('mathSymbolsModalCancelBtn');
const mathSymbolsTable = document.getElementById('mathSymbolsTable').querySelector('tbody');
const mathSymbolsDialog = document.querySelector('.math-symbols-modal-dialog');
const mathSymbolsModalInsertBtn = document.getElementById('mathSymbolsModalInsertBtn');
const mathSymbolsSearch = document.getElementById('mathSymbolsSearch');
let selectedSymbolRow = null;
let selectedSymbolCode = null;

const mathSymbolsList = [
  { symbol: '\\( \\alpha \\)', code: '\\alpha', keywords: 'greek lowercase alpha' },
  { symbol: '\\( \\beta \\)', code: '\\beta', keywords: 'greek lowercase beta' },
  { symbol: '\\( \\gamma \\)', code: '\\gamma', keywords: 'greek lowercase gamma' },
  { symbol: '\\( \\delta \\)', code: '\\delta', keywords: 'greek lowercase delta' },
  { symbol: '\\( \\epsilon \\)', code: '\\epsilon', keywords: 'greek lowercase epsilon' },
  { symbol: '\\( \\zeta \\)', code: '\\zeta', keywords: 'greek lowercase zeta' },
  { symbol: '\\( \\eta \\)', code: '\\eta', keywords: 'greek lowercase eta' },
  { symbol: '\\( \\theta \\)', code: '\\theta', keywords: 'greek lowercase theta' },
  { symbol: '\\( \\iota \\)', code: '\\iota', keywords: 'greek lowercase iota' },
  { symbol: '\\( \\kappa \\)', code: '\\kappa', keywords: 'greek lowercase kappa' },
  { symbol: '\\( \\lambda \\)', code: '\\lambda', keywords: 'greek lowercase lambda' },
  { symbol: '\\( \\mu \\)', code: '\\mu', keywords: 'greek lowercase mu' },
  { symbol: '\\( \\nu \\)', code: '\\nu', keywords: 'greek lowercase nu' },
  { symbol: '\\( \\xi \\)', code: '\\xi', keywords: 'greek lowercase xi' },
  { symbol: '\\( \\omicron \\)', code: '\\omicron', keywords: 'greek lowercase omicron' },
  { symbol: '\\( \\pi \\)', code: '\\pi', keywords: 'greek lowercase pi' },
  { symbol: '\\( \\rho \\)', code: '\\rho', keywords: 'greek lowercase rho' },
  { symbol: '\\( \\sigma \\)', code: '\\sigma', keywords: 'greek lowercase sigma' },
  { symbol: '\\( \\tau \\)', code: '\\tau', keywords: 'greek lowercase tau' },
  { symbol: '\\( \\upsilon \\)', code: '\\upsilon', keywords: 'greek lowercase upsilon' },
  { symbol: '\\( \\phi \\)', code: '\\phi', keywords: 'greek lowercase phi' },
  { symbol: '\\( \\chi \\)', code: '\\chi', keywords: 'greek lowercase chi' },
  { symbol: '\\( \\psi \\)', code: '\\psi', keywords: 'greek lowercase psi' },
  { symbol: '\\( \\omega \\)', code: '\\omega', keywords: 'greek lowercase omega' },
  { symbol: '\\( \\Gamma \\)', code: '\\Gamma', keywords: 'greek uppercase gamma' },
  { symbol: '\\( \\Delta \\)', code: '\\Delta', keywords: 'greek uppercase delta' },
  { symbol: '\\( \\Theta \\)', code: '\\Theta', keywords: 'greek uppercase theta' },
  { symbol: '\\( \\Lambda \\)', code: '\\Lambda', keywords: 'greek uppercase lambda' },
  { symbol: '\\( \\Xi \\)', code: '\\Xi', keywords: 'greek uppercase xi' },
  { symbol: '\\( \\Pi \\)', code: '\\Pi', keywords: 'greek uppercase pi' },
  { symbol: '\\( \\Sigma \\)', code: '\\Sigma', keywords: 'greek uppercase sigma' },
  { symbol: '\\( \\Upsilon \\)', code: '\\Upsilon', keywords: 'greek uppercase upsilon' },
  { symbol: '\\( \\Phi \\)', code: '\\Phi', keywords: 'greek uppercase phi' },
  { symbol: '\\( \\Psi \\)', code: '\\Psi', keywords: 'greek uppercase psi' },
  { symbol: '\\( \\Omega \\)', code: '\\Omega', keywords: 'greek uppercase omega' },
  { symbol: '\\( + \\)', code: '+', keywords: 'plus add addition' },
  { symbol: '\\( - \\)', code: '-', keywords: 'minus subtract subtraction' },
  { symbol: '\\( \\pm \\)', code: '\\pm', keywords: 'plus-minus plus minus add subtract' },
  { symbol: '\\( \\mp \\)', code: '\\mp', keywords: 'minus-plus minus plus subtract add' },
  { symbol: '\\( \\times \\)', code: '\\times', keywords: 'multiply multiplication cross product' },
  { symbol: '\\( \\div \\)', code: '\\div', keywords: 'divide division obelus' },
  { symbol: '\\( \\cdot \\)', code: '\\cdot', keywords: 'dot multiplication product' },
  { symbol: '\\( \\ast \\)', code: '\\ast', keywords: 'asterisk star multiplication' },
  { symbol: '\\( \\star \\)', code: '\\star', keywords: 'star multiplication' },
  { symbol: '\\( \\circ \\)', code: '\\circ', keywords: 'circle ring composition' },
  { symbol: '\\( \\bullet \\)', code: '\\bullet', keywords: 'bullet dot product list' },
  { symbol: '\\( \\oplus \\)', code: '\\oplus', keywords: 'circle direct sum xor plus' },
  { symbol: '\\( \\ominus \\)', code: '\\ominus', keywords: 'circle direct difference minus' },
  { symbol: '\\( \\otimes \\)', code: '\\otimes', keywords: 'circle tensor product outer multiplication' },
  { symbol: '\\( \\oslash \\)', code: '\\oslash', keywords: 'divide circle circled division quotient set' },
  { symbol: '\\( \\odot \\)', code: '\\odot', keywords: 'circle circled hadamard product dot' },
  { symbol: '\\( \\bigcirc \\)', code: '\\bigcirc', keywords: 'big circle operator' },
  { symbol: '\\( \\triangleleft \\)', code: '\\triangleleft', keywords: 'triangle left normal subgroup' },
  { symbol: '\\( \\triangleright \\)', code: '\\triangleright', keywords: 'triangle right contains' },
  { symbol: '\\( \\bigtriangleup \\)', code: '\\bigtriangleup', keywords: 'solid pyramid triangle up' },
  { symbol: '\\( \\bigtriangledown \\)', code: '\\bigtriangledown', keywords: 'solid inverted delta triangle down' },
  { symbol: '\\( \\wedge \\)', code: '\\wedge', keywords: 'logical and wedge meet' },
  { symbol: '\\( \\vee \\)', code: '\\vee', keywords: 'logical or vee join' },
  { symbol: '\\( \\cap \\)', code: '\\cap', keywords: 'set intersection cap meet' },
  { symbol: '\\( \\cup \\)', code: '\\cup', keywords: 'set union cup join' },
  { symbol: '\\( \\setminus \\)', code: '\\setminus', keywords: 'set difference backslash' },
  { symbol: '\\( \\wr \\)', code: '\\wr', keywords: 'wreath product' },
  { symbol: '\\( \\diamond \\)', code: '\\diamond', keywords: 'diamond lozenge' },
  { symbol: '\\( \\lhd \\)', code: '\\lhd', keywords: 'triangle left normal subgroup' },
  { symbol: '\\( \\rhd \\)', code: '\\rhd', keywords: 'triangle right contains' },
  { symbol: '\\( \\unlhd \\)', code: '\\unlhd', keywords: 'triangle left equal normal subgroup' },
  { symbol: '\\( \\unrhd \\)', code: '\\unrhd', keywords: 'triangle right equal contains' },
  { symbol: '\\( = \\)', code: '=', keywords: 'equal to equals' },
  { symbol: '\\( \\neq \\)', code: '\\neq', keywords: 'not equal to not equals' },
  { symbol: '\\( < \\)', code: '<', keywords: 'less smaller than' },
  { symbol: '\\( > \\)', code: '>', keywords: 'greater more than' },
  { symbol: '\\( \\leq \\)', code: '\\leq', keywords: 'less smaller than or equal to' },
  { symbol: '\\( \\geq \\)', code: '\\geq', keywords: 'greater more than or equal to' },
  { symbol: '\\( \\equiv \\)', code: '\\equiv', keywords: 'equivalent congruent to' },
  { symbol: '\\( \\sim \\)', code: '\\sim', keywords: 'tilde similar' },
  { symbol: '\\( \\simeq \\)', code: '\\simeq', keywords: 'asymptotically equal similar' },
  { symbol: '\\( \\approx \\)', code: '\\approx', keywords: 'approximately equal almost equal' },
  { symbol: '\\( \\cong \\)', code: '\\cong', keywords: 'congruent equal equivalent' },
  { symbol: '\\( \\propto \\)', code: '\\propto', keywords: 'proportional to' },
  { symbol: '\\( \\in \\)', code: '\\in', keywords: 'element of in set' },
  { symbol: '\\( \\ni \\)', code: '\\ni', keywords: 'contains as member has element' },
  { symbol: '\\( \\notin \\)', code: '\\notin', keywords: 'not element of not in set' },
  { symbol: '\\( \\subset \\)', code: '\\subset', keywords: 'included in' },
  { symbol: '\\( \\supset \\)', code: '\\supset', keywords: 'superset includes' },
  { symbol: '\\( \\subseteq \\)', code: '\\subseteq', keywords: 'subset equal include' },
  { symbol: '\\( \\supseteq \\)', code: '\\supseteq', keywords: 'superset equal include' },
  { symbol: '\\( \\nsubseteq \\)', code: '\\nsubseteq', keywords: 'not subset equal' },
  { symbol: '\\( \\nsupseteq \\)', code: '\\nsupseteq', keywords: 'not superset equal' },
  { symbol: '\\( \\subsetneq \\)', code: '\\subsetneq', keywords: 'proper strict subset not equal' },
  { symbol: '\\( \\supsetneq \\)', code: '\\supsetneq', keywords: 'proper strict superset not equal' },
  { symbol: '\\( \\parallel \\)', code: '\\parallel', keywords: 'parallel' },
  { symbol: '\\( \\nparallel \\)', code: '\\nparallel', keywords: 'not parallel' },
  { symbol: '\\( \\perp \\)', code: '\\perp', keywords: 'perpendicular orthogonal' },
  { symbol: '\\( \\mid \\)', code: '\\mid', keywords: 'divides such that vertical' },
  { symbol: '\\( \\nmid \\)', code: '\\nmid', keywords: 'does not divide' },
  { symbol: '\\( \\vdash \\)', code: '\\vdash', keywords: 'entails proves' },
  { symbol: '\\( \\dashv \\)', code: '\\dashv', keywords: 'is entailed by' },
  { symbol: '\\( \\models \\)', code: '\\models', keywords: 'satisfies true in' },
  { symbol: '\\( \\leftarrow \\)', code: '\\leftarrow', keywords: 'west assignment' },
  { symbol: '\\( \\rightarrow \\)', code: '\\rightarrow', keywords: 'east implies function' },
  { symbol: '\\( \\leftrightarrow \\)', code: '\\leftrightarrow', keywords: 'double sided horizontal bidirectional' },
  { symbol: '\\( \\Leftarrow \\)', code: '\\Leftarrow', keywords: 'double thick reverse implication' },
  { symbol: '\\( \\Rightarrow \\)', code: '\\Rightarrow', keywords: 'double thick logical implication' },
  { symbol: '\\( \\Leftrightarrow \\)', code: '\\Leftrightarrow', keywords: 'double sided horizontal bidirectional thick iff if and only if logical equivalence' },
  { symbol: '\\( \\uparrow \\)', code: '\\uparrow', keywords: 'north' },
  { symbol: '\\( \\downarrow \\)', code: '\\downarrow', keywords: 'south' },
  { symbol: '\\( \\updownarrow \\)', code: '\\updownarrow', keywords: 'double sided vertical bidirectional' },
  { symbol: '\\( \\Uparrow \\)', code: '\\Uparrow', keywords: 'double thick' },
  { symbol: '\\( \\Downarrow \\)', code: '\\Downarrow', keywords: 'double thick' },
  { symbol: '\\( \\Updownarrow \\)', code: '\\Updownarrow', keywords: 'double sided vertical bidirectional thick' },
  { symbol: '\\( \\forall \\)', code: '\\forall', keywords: 'for all universal quantifier every' },
  { symbol: '\\( \\exists \\)', code: '\\exists', keywords: 'there exists existential quantifier' },
  { symbol: '\\( \\neg \\)', code: '\\neg', keywords: 'not negation' },
  { symbol: '\\( \\land \\)', code: '\\land', keywords: 'and logical conjunction' },
  { symbol: '\\( \\lor \\)', code: '\\lor', keywords: 'or logical disjunction' },
  { symbol: '\\( \\int \\)', code: '\\int', keywords: 'integral integration' },
  { symbol: '\\( \\iint \\)', code: '\\iint', keywords: 'double integral surface integration' },
  { symbol: '\\( \\iiint \\)', code: '\\iiint', keywords: 'triple integral volume integration' },
  { symbol: '\\( \\oint \\)', code: '\\oint', keywords: 'contour integral closed integration' },
  { symbol: '\\( \\sum \\)', code: '\\sum', keywords: 'summation sigma' },
  { symbol: '\\( \\prod \\)', code: '\\prod', keywords: 'product pi' },
  { symbol: '\\( \\coprod \\)', code: '\\coprod', keywords: 'coproduct dual product' },
  { symbol: '\\( \\lim \\)', code: '\\lim', keywords: 'limit approaching' },
  { symbol: '\\( \\infty \\)', code: '\\infty', keywords: 'infinity infinite' },
  { symbol: '\\( \\partial \\)', code: '\\partial', keywords: 'derivative' },
  { symbol: '\\( \\sqrt{x} \\)', code: '\\sqrt{x}', keywords: 'square root radical' },
  { symbol: '\\( \\sqrt[n]{x} \\)', code: '\\sqrt[n]{x}', keywords: 'nth root radical index' },
  { symbol: '\\( \\frac{a}{b} \\)', code: '\\frac{a}{b}', keywords: 'fraction divide division ratio' },
  { symbol: '\\( \\binom{n}{k} \\)', code: '\\binom{n}{k}', keywords: 'binomial coefficient choose combinations' },
  { symbol: '\\( \\limsup \\)', code: '\\limsup', keywords: 'limit superior upper limit real analysis' },
  { symbol: '\\( \\liminf \\)', code: '\\liminf', keywords: 'limit inferior lower limit real analysis' },
  { symbol: '\\( \\nabla \\)', code: '\\nabla', keywords: 'gradient del operator vector divergence curl' },
  { symbol: '\\( \\overline{x} \\)', code: '\\overline{x}', keywords: 'mean bar notation complex conjugate average' },
  { symbol: '\\( \\underline{x} \\)', code: '\\underline{x}', keywords: 'underline bar emphasize lower bound notation' },
  { symbol: '\\( \\dot{x} \\)', code: '\\dot{x}', keywords: 'time derivative newton notation' },
  { symbol: '\\( \\ddot{x} \\)', code: '\\ddot{x}', keywords: 'double second derivative acceleration newton notation' },
  { symbol: '\\( \\varlimsup \\)', code: '\\varlimsup', keywords: 'variant upper limit' },
  { symbol: '\\( \\varliminf \\)', code: '\\varliminf', keywords: 'variant lower limit' },
  { symbol: '\\( \\varinjlim \\)', code: '\\varinjlim', keywords: 'variant inductive direct limit colimit' },
  { symbol: '\\( \\varprojlim \\)', code: '\\varprojlim', keywords: 'variant projective inverse limit' },
  { symbol: '\\( \\smallint \\)', code: '\\smallint', keywords: 'tiny inline integral' },
  { symbol: '\\( \\therefore \\)', code: '\\therefore', keywords: 'therefore conclusion so thus logic symbol' },
  { symbol: '\\( \\because \\)', code: '\\because', keywords: 'because since reason logic symbol' },
  { symbol: '\\( \\implies \\)', code: '\\implies', keywords: 'implies implication logic if then' },
  { symbol: '\\( \\iff \\)', code: '\\iff', keywords: 'if and only if equivalence logic' },
  { symbol: '\\( \\not \\)', code: '\\not', keywords: 'not logical negation' },
  { symbol: '\\( \\bigcup \\)', code: '\\bigcup', keywords: 'union set theory big large disjoint union' },
  { symbol: '\\( \\bigcap \\)', code: '\\bigcap', keywords: 'intersection set theory big large intersection common elements' },
  { symbol: '\\( \\complement \\)', code: '\\complement', keywords: 'set difference theory negation' },
  { symbol: '\\( \\exists! \\)', code: '\\exists!', keywords: 'there unique existence quantifier logic' },
  { symbol: '\\( \\langle \\)', code: '\\langle', keywords: 'left bracket inner product dirac vector notation' },
  { symbol: '\\( \\rangle \\)', code: '\\rangle', keywords: 'right bracket inner product dirac vector notation' },
  { symbol: '\\( \\lfloor \\)', code: '\\lfloor', keywords: 'left bracket function greatest integer less than' },
  { symbol: '\\( \\rfloor \\)', code: '\\rfloor', keywords: 'right bracket function integer part' },
  { symbol: '\\( \\lceil \\)', code: '\\lceil', keywords: 'left ceiling bracket function smallest integer greater than' },
  { symbol: '\\( \\rceil \\)', code: '\\rceil', keywords: 'right ceiling bracket function integer ceiling' },
  { symbol: '\\( \\dotsb \\)', code: '\\dotsb', keywords: 'binary operators ellipsis math between terms' },
  { symbol: '\\( \\dotsi \\)', code: '\\dotsi', keywords: 'integrals ellipsis math in integrals' },
  { symbol: '\\( \\dotsc \\)', code: '\\dotsc', keywords: 'commas separated dots ellipsis list continuation' },
  { symbol: '\\( \\dotso \\)', code: '\\dotso', keywords: 'others ellipsis contexts trailing general use' },
  { symbol: '\\( \\hookrightarrow \\)', code: '\\hookrightarrow', keywords: 'injection function inclusion imbedding' },
  { symbol: '\\( \\hookleftarrow \\)', code: '\\hookleftarrow', keywords: 'injection function' },
  { symbol: '\\( \\mapsto \\)', code: '\\mapsto', keywords: 'maps to mapping function arrow notation transformation' },
  { symbol: '\\( \\longrightarrow \\)', code: '\\longrightarrow', keywords: 'function implication output logical consequence' },
  { symbol: '\\( \\longleftarrow \\)', code: '\\longleftarrow', keywords: 'reverse implication input mapping' },
  { symbol: '\\( \\longleftrightarrow \\)', code: '\\longleftrightarrow', keywords: 'double equivalence bidirectional relation' },
  { symbol: '\\( \\Longrightarrow \\)', code: '\\Longrightarrow', keywords: 'double logical implication implies deduce inference' },
  { symbol: '\\( \\Longleftarrow \\)', code: '\\Longleftarrow', keywords: 'double reverse inference logical consequence' },
  { symbol: '\\( \\Longleftrightarrow \\)', code: '\\Longleftrightarrow', keywords: 'double equivalence arrow iff if and only if logical equivalence' },
  { symbol: '\\( \\vec{v} \\)', code: '\\vec{v}', keywords: 'vector arrow notation direction magnitude' },
  { symbol: '\\( \\hat{x} \\)', code: '\\hat{x}', keywords: 'accent estimator unit vector normalization' },
  { symbol: '\\( \\tilde{x} \\)', code: '\\tilde{x}', keywords: 'accent approximation perturbation' },
  { symbol: '\\( \\bar{x} \\)', code: '\\bar{x}', keywords: 'accent mean average complex conjugate' },
  { symbol: '\\( \\dfrac{a}{b} \\)', code: '\\dfrac{a}{b}', keywords: 'display fraction division' },
  { symbol: '\\( \\tfrac{a}{b} \\)', code: '\\tfrac{a}{b}', keywords: 'text fraction inline division' },
  { symbol: '\\( \\bmod \\)', code: '\\bmod', keywords: 'modulo remainder arithmetic operation congruence' },
  { symbol: '\\( \\pmod{n} \\)', code: '\\pmod{n}', keywords: 'parentheses modulo modular arithmetic operation congruence class' },
  { symbol: '\\( \\left\\lfloor x \\right\\rfloor \\)', code: '\\left\\lfloor x \\right\\rfloor', keywords: 'function bracket notation greatest integer' },
  { symbol: '\\( \\left\\lceil x \\right\\rceil \\)', code: '\\left\\lceil x \\right\\rceil', keywords: 'ceiling function bracket notation smallest integer' },
  { symbol: '\\( \\rightarrowtail \\)', code: '\\rightarrowtail', keywords: 'feather east' },
  { symbol: '\\( \\leftarrowtail \\)', code: '\\leftarrowtail', keywords: 'feather west' },
  { symbol: '\\( \\twoheadrightarrow \\)', code: '\\twoheadrightarrow', keywords: 'two head east spear' },
  { symbol: '\\( \\twoheadleftarrow \\)', code: '\\twoheadleftarrow', keywords: 'two head west spear' },
  { symbol: '\\( \\rightsquigarrow \\)', code: '\\rightsquigarrow', keywords: 'east squiggly spear' },
  { symbol: '\\( \\leftrightsquigarrow \\)', code: '\\leftrightsquigarrow', keywords: 'double sided squiggly wavy' },
  { symbol: '\\( \\looparrowright \\)', code: '\\looparrowright', keywords: 'east cyclic' },
  { symbol: '\\( \\looparrowleft \\)', code: '\\looparrowleft', keywords: 'west cyclic' },
  { symbol: '\\( \\curvearrowleft \\)', code: '\\curvearrowleft', keywords: 'curved west' },
  { symbol: '\\( \\curvearrowright \\)', code: '\\curvearrowright', keywords: 'curved east' },
  { symbol: '\\( \\circlearrowleft \\)', code: '\\circlearrowleft', keywords: 'circular rotation west' },
  { symbol: '\\( \\circlearrowright \\)', code: '\\circlearrowright', keywords: 'circular rotation east' },
  { symbol: '\\( \\rightleftharpoons \\)', code: '\\rightleftharpoons', keywords: 'equilibrium double sided' },
  { symbol: '\\( \\leftrightharpoons \\)', code: '\\leftrightharpoons', keywords: 'equilibrium double sided' },
  { symbol: '\\( \\rightharpoonup \\)', code: '\\rightharpoonup', keywords: 'reaction arrow' },
  { symbol: '\\( \\rightharpoondown \\)', code: '\\rightharpoondown', keywords: 'chem arrow' },
  { symbol: '\\( \\leftharpoonup \\)', code: '\\leftharpoonup', keywords: 'reaction arrow' },
  { symbol: '\\( \\leftharpoondown \\)', code: '\\leftharpoondown', keywords: 'chem arrow' },
  { symbol: '\\( \\upharpoonleft \\)', code: '\\upharpoonleft', keywords: 'chem arrow' },
  { symbol: '\\( \\upharpoonright \\)', code: '\\upharpoonright', keywords: 'chem arrow' },
  { symbol: '\\( \\downharpoonleft \\)', code: '\\downharpoonleft', keywords: 'chem arrow' },
  { symbol: '\\( \\downharpoonright \\)', code: '\\downharpoonright', keywords: 'chem arrow' },
  { symbol: '\\( \\sqsubset \\)', code: '\\sqsubset', keywords: 'square partial order' },
  { symbol: '\\( \\sqsupset \\)', code: '\\sqsupset', keywords: 'square superset partial order' },
  { symbol: '\\( \\sqsubseteq \\)', code: '\\sqsubseteq', keywords: 'square subset or equal' },
  { symbol: '\\( \\sqsupseteq \\)', code: '\\sqsupseteq', keywords: 'square superset or equal' },
  { symbol: '\\( \\varsubsetneq \\)', code: '\\varsubsetneq', keywords: 'variant not equal strict subset' },
  { symbol: '\\( \\varsupsetneq \\)', code: '\\varsupsetneq', keywords: 'variant strict superset not equal' },
  { symbol: '\\( \\subsetneqq \\)', code: '\\subsetneqq', keywords: 'strict double less not equal' },
  { symbol: '\\( \\supsetneqq \\)', code: '\\supsetneqq', keywords: 'superset not equal strict double greater' },
  { symbol: '\\( \\nsubseteqq \\)', code: '\\nsubseteqq', keywords: 'not equal invalid set' },
  { symbol: '\\( \\Game \\)', code: '\\Game', keywords: 'loopy G math symbol' },
  { symbol: '\\( \\Bbbk \\)', code: '\\Bbbk', keywords: 'blackboard bold k math field constant' },
  { symbol: '\\( \\overbrace{a+b+c} \\)', code: '\\overbrace{a+b+c}', keywords: 'grouping above' },
  { symbol: '\\( \\underbrace{a+b+c} \\)', code: '\\underbrace{a+b+c}', keywords: 'grouping below' },
  { symbol: '\\( \\overleftarrow{AB} \\)', code: '\\overleftarrow{AB}', keywords: 'vector notation' },
  { symbol: '\\( \\overrightarrow{AB} \\)', code: '\\overrightarrow{AB}', keywords: 'vector notation' },
  { symbol: '\\( \\underleftarrow{AB} \\)', code: '\\underleftarrow{AB}', keywords: 'vector' },
  { symbol: '\\( \\underrightarrow{AB} \\)', code: '\\underrightarrow{AB}', keywords: 'vector' },
  { symbol: '\\( \\overleftrightarrow{AB} \\)', code: '\\overleftrightarrow{AB}', keywords: 'both sided directions vector' },
  { symbol: '\\( \\underleftrightarrow{AB} \\)', code: '\\underleftrightarrow{AB}', keywords: 'both sided directions vector' },
  { symbol: '\\( \\mathring{x} \\)', code: '\\mathring{x}', keywords: 'accent interior open set' },
  { symbol: '\\( \\lvert \\)', code: '\\lvert', keywords: 'left vertical bar absolute value magnitude' },
  { symbol: '\\( \\rvert \\)', code: '\\rvert', keywords: 'right vertical bar absolute value magnitude' },
  { symbol: '\\( \\lVert \\)', code: '\\lVert', keywords: 'left double vertical bar norm magnitude parallel' },
  { symbol: '\\( \\rVert \\)', code: '\\rVert', keywords: 'right double vertical bar norm magnitude parallel' },
  { symbol: '\\( \\left( \\right) \\)', code: '\\left( \\right)', keywords: 'parentheses brackets round delimiter' },
  { symbol: '\\( \\left[ \\right] \\)', code: '\\left[ \\right]', keywords: 'square brackets delimiter' },
  { symbol: '\\( \\left\\{ \\right\\} \\)', code: '\\left\\{ \\right\\}', keywords: 'curly braces delimiter set' },
  { symbol: '\\( \\left| \\right| \\)', code: '\\left| \\right|', keywords: 'absolute value bars magnitude delimiter' },
  { symbol: '\\( \\left\\langle \\right\\rangle \\)', code: '\\left\\langle \\right\\rangle', keywords: 'angle brackets inner product dirac vector notation delimiter' },
  { symbol: '\\( \\bigwedge \\)', code: '\\bigwedge', keywords: 'and operator logical intersection' },
  { symbol: '\\( \\bigvee \\)', code: '\\bigvee', keywords: 'or operator logical union' },
  { symbol: '\\( \\bigsqcup \\)', code: '\\bigsqcup', keywords: 'disjoint union' },
  { symbol: '\\( \\bigodot \\)', code: '\\bigodot', keywords: 'circle operator' },
  { symbol: '\\( \\bigotimes \\)', code: '\\bigotimes', keywords: 'circle tensor cross product' },
  { symbol: '\\( \\bigoplus \\)', code: '\\bigoplus', keywords: 'circle direct sum' },
  { symbol: '\\( \\biguplus \\)', code: '\\biguplus', keywords: 'multiset disjoint union plus' },
  { symbol: '\\( \\text{Text} \\)', code: '\\text{Text}', keywords: 'normal words' },
  { symbol: '\\( \\mathrm{ABC} \\)', code: '\\mathrm{ABC}', keywords: 'upright roman text' },
  { symbol: '\\( \\mathit{ABC} \\)', code: '\\mathit{ABC}', keywords: 'italic' },
  { symbol: '\\( \\mathbf{ABC} \\)', code: '\\mathbf{ABC}', keywords: 'bold' },
  { symbol: '\\( \\mathsf{ABC} \\)', code: '\\mathsf{ABC}', keywords: 'sans serif' },
  { symbol: '\\( \\mathtt{ABC} \\)', code: '\\mathtt{ABC}', keywords: 'monospace typewriter' },
  { symbol: '\\( \\mathcal{ABC} \\)', code: '\\mathcal{ABC}', keywords: 'calligraphic script' },
  { symbol: '\\( \\mathbb{ABC} \\)', code: '\\mathbb{ABC}', keywords: 'blackboard bold double struck' },
  { symbol: '\\( \\mathfrak{ABC} \\)', code: '\\mathfrak{ABC}', keywords: 'fraktur gothic' },
  { symbol: '1 em Space', code: '\\quad', keywords: 'space' },
  { symbol: '2 em Space', code: '\\qquad', keywords: 'double space' },
  { symbol: '\\( \\cdots \\)', code: '\\cdots', keywords: 'horizontal' },
  { symbol: '\\( \\ldots \\)', code: '\\ldots', keywords: 'low ellipsis' },
  { symbol: '\\( \\vdots \\)', code: '\\vdots', keywords: 'vertical' },
  { symbol: '\\( \\ddots \\)', code: '\\ddots', keywords: 'diagonal' },
  { symbol: '\\( \\cfrac{a}{b} \\)', code: '\\cfrac{a}{b}', keywords: 'continued fraction' },
  { symbol: '\\( \\genfrac{}{}{0pt}{}{a}{b} \\)', code: '\\genfrac{}{}{0pt}{}{a}{b}', keywords: 'general fraction binomial' },
  { symbol: '\\( \\overline{abc} \\)', code: '\\overline{abc}', keywords: 'bar above' },
  { symbol: '\\( \\underline{abc} \\)', code: '\\underline{abc}', keywords: 'bar below' },
  { symbol: '\\( \\varepsilon \\)', code: '\\varepsilon', keywords: 'variant' },
  { symbol: '\\( \\vartheta \\)', code: '\\vartheta', keywords: 'variant' },
  { symbol: '\\( \\varpi \\)', code: '\\varpi', keywords: 'variant' },
  { symbol: '\\( \\varrho \\)', code: '\\varrho', keywords: 'variant' },
  { symbol: '\\( \\varsigma \\)', code: '\\varsigma', keywords: 'variant' },
  { symbol: '\\( \\varphi \\)', code: '\\varphi', keywords: 'variant' },
  { symbol: '\\( \\ell \\)', code: '\\ell', keywords: 'length script cursive l' },
  { symbol: '\\( \\Im \\)', code: '\\Im', keywords: 'imaginary part' },
  { symbol: '\\( \\wp \\)', code: '\\wp', keywords: 'weierstrass p elliptic function' },
  { symbol: '\\( x^\\circ \\)', code: 'x^\\circ', keywords: 'degree angle measure temperature polar coordinates' },
  { symbol: '\\( \\prime \\)', code: '\\prime', keywords: 'derivative notation function mark' },
  { symbol: '\\( \\nexists \\)', code: '\\nexists', keywords: 'does not exist negation logic quantifier' },
  { symbol: '\\( \\imath \\)', code: '\\imath', keywords: 'dotless i imaginary unit' },
  { symbol: '\\( \\jmath \\)', code: '\\jmath', keywords: 'dotless j imaginary unit' },
  { symbol: '\\( \\text{...} \\)', code: '\\text{...}', keywords: 'ellipsis inline mode normal' },
  { symbol: '\\( \\operatorname{foo} \\)', code: '\\operatorname{foo}', keywords: 'custom function' },
  { symbol: '\\( \\triangleq \\)', code: '\\triangleq', keywords: 'equals definition equal by def' },
  { symbol: '\\( \\blacksquare \\)', code: '\\blacksquare', keywords: 'end proof qed solid' },
  { symbol: '\\( \\blacktriangle \\)', code: '\\blacktriangle', keywords: 'up filled solid north' },
  { symbol: '\\( \\blacktriangledown \\)', code: '\\blacktriangledown', keywords: 'filled solid south' },
  { symbol: '\\( \\blacktriangleleft \\)', code: '\\blacktriangleleft', keywords: 'filled solid west' },
  { symbol: '\\( \\blacktriangleright \\)', code: '\\blacktriangleright', keywords: 'filled solid east' },
  { symbol: '\\( \\circledast \\)', code: '\\circledast', keywords: 'asterisk star operator convolution' },
  { symbol: '\\( \\circledcirc \\)', code: '\\circledcirc', keywords: 'ring operator' },
  { symbol: '\\( \\circleddash \\)', code: '\\circleddash', keywords: 'minus operator' },
  { symbol: '\\( \\lozenge \\)', code: '\\lozenge', keywords: 'diamond hollow rhombus' },
  { symbol: '\\( \\blacklozenge \\)', code: '\\blacklozenge', keywords: 'diamond solid rhombus filled' },
  { symbol: '\\( \\diagdown \\)', code: '\\diagdown', keywords: 'diagonal slash backslash' },
  { symbol: '\\( \\diagup \\)', code: '\\diagup', keywords: 'diagonal slash forward' },
  { symbol: '\\( \\surd \\)', code: '\\surd', keywords: 'square root radical check mark' },
  { symbol: '\\( \\mho \\)', code: '\\mho', keywords: 'inverted ohm conductance siemens' },
  { symbol: '\\( \\beth \\)', code: '\\beth', keywords: 'cardinal number hebrew letter' },
  { symbol: '\\( \\gimel \\)', code: '\\gimel', keywords: 'cardinal number hebrew letter' },
  { symbol: '\\( \\daleth \\)', code: '\\daleth', keywords: 'cardinal number hebrew letter' },
  { symbol: '\\( \\eth \\)', code: '\\eth', keywords: 'old english icelandic letter' },
  { symbol: '\\( \\digamma \\)', code: '\\digamma', keywords: 'archaic greek' },
  { symbol: '\\( \\varkappa \\)', code: '\\varkappa', keywords: 'variant' },
  { symbol: '\\( \\hslash \\)', code: '\\hslash', keywords: 'bar planck constant' },
  { symbol: '\\( \\maltese \\)', code: '\\maltese', keywords: 'cross' },
  { symbol: '\\( \\yen \\)', code: '\\yen', keywords: 'currency money japan' },
  { symbol: '\\( \\checkmark \\)', code: '\\checkmark', keywords: 'tick' },
  { symbol: '\\( \\circledR \\)', code: '\\circledR', keywords: 'registered trademark' },
  { symbol: '\\( \\circledS \\)', code: '\\circledS', keywords: 'service mark' },
  { symbol: '\\( \\Re \\)', code: '\\Re', keywords: 'real part' },
  { symbol: '\\( \\aleph \\)', code: '\\aleph', keywords: 'infinity cardinality' },
  { symbol: '\\( \\hbar \\)', code: '\\hbar', keywords: 'planck constant quantum' }
];

function selectSymbolRow(tr, code) {
  if (selectedSymbolRow) selectedSymbolRow.classList.remove('selected');
  selectedSymbolRow = tr;
  selectedSymbolCode = `$${code}$`;
  tr.classList.add('selected');
  const enable = isNoteSelectedAndEditable();
  mathSymbolsModalInsertBtn.disabled = !enable;
  mathSymbolsModalInsertBtn.style.cursor = enable ? '' : 'not-allowed';
}

mathSymbolsModalInsertBtn.onclick = function() {
  if (!selectedSymbolCode || markdownInput.readOnly) return;
  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  const value = markdownInput.value;
  markdownInput.value = value.substring(0, start) + selectedSymbolCode + value.substring(end);
  markdownInput.selectionStart = markdownInput.selectionEnd = start + selectedSymbolCode.length;
  markdownInput.focus();
  renderMarkdownWithMath(markdownInput.value);
  if (currentNoteKey && notesData[currentNoteKey] && !isNoteOrAncestorDeleted(currentNoteKey)) {
    notesData[currentNoteKey].content = markdownInput.value;
  }
  mathSymbolsModalBg.classList.remove('show');
};

let mathSymbolsFiltered = mathSymbolsList.slice();
function fillMathSymbolsTable(filter = '') {
  mathSymbolsTable.innerHTML = '';
  selectedSymbolRow = null;
  selectedSymbolCode = null;
  mathSymbolsModalInsertBtn.disabled = true;

  let filterLower = (filter || '').toLowerCase();
  let filterWords = filterLower.split(/\s+/).filter(Boolean);

  mathSymbolsFiltered = mathSymbolsList.slice();

  if (filterWords.length > 0) {
    mathSymbolsFiltered = mathSymbolsFiltered.filter(item => {
      const searchableWords = (
        (item.code?.toLowerCase() || '') + ' ' +
        (item.symbol?.toLowerCase() || '') + ' ' +
        (item.keywords?.toLowerCase() || '')
      ).split(/\s+/).filter(Boolean);

      return filterWords.every(word =>
        searchableWords.some(sw => sw.startsWith(word))
      );
    });
  }

  if (filterWords.length > 0) {
    mathSymbolsFiltered.sort((a, b) => {
      function matchCount(item) {
        const searchableWords = (
          (item.code?.toLowerCase() || '') + ' ' +
          (item.symbol?.toLowerCase() || '') + ' ' +
          (item.keywords?.toLowerCase() || '')
        ).split(/\s+/).filter(Boolean);
        return filterWords.reduce((acc, word) =>
          acc + (searchableWords.some(sw => sw.startsWith(word)) ? 1 : 0), 0);
      }
      return matchCount(b) - matchCount(a);
    });
  }

  mathSymbolsFiltered.forEach((item) => {
    const tr = document.createElement('tr');
    const tdSymbol = document.createElement('td');
    tdSymbol.innerHTML = item.symbol;
    tdSymbol.style.fontFamily = 'serif';
    tdSymbol.title = 'Symbol';
    const tdCode = document.createElement('td');
    tdCode.textContent = item.code;
    tdCode.style.fontFamily = 'monospace';
    tdCode.title = 'LaTeX Code';

    tr.tabIndex = 0;
    tr.addEventListener('click', function() {
      selectSymbolRow(tr, item.code);
    });
    tr.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        selectSymbolRow(tr, item.code);
        e.preventDefault();
      }
    });

    tr.appendChild(tdSymbol);
    tr.appendChild(tdCode);
    mathSymbolsTable.appendChild(tr);
  });

  if (window.MathJax) {
    MathJax.typesetPromise([mathSymbolsTable]);
  }
}

mathSymbolsSearch.addEventListener('input', function() {
  fillMathSymbolsTable(this.value);
});

if (window.require) {
  try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('menu-insert-math-symbols', () => {
      closeAllModals();
      mathSymbolsSearch.value = '';
      fillMathSymbolsTable();
      mathSymbolsModalInsertBtn.disabled = true;
      mathSymbolsModalInsertBtn.style.cursor = 'not-allowed';
      mathSymbolsModalBg.classList.add('show');
      // Focus immediately (no 100ms timeout)
      focusAndPlaceCaretEnd(mathSymbolsSearch);
    });
  } catch (error) {
    console.error('Failed to set up IPC communication for math symbols:', error);
  }
}

mathSymbolsModalCancelBtn.onclick = function() {
  mathSymbolsModalBg.classList.remove('show');
  selectedSymbolRow = null;
  selectedSymbolCode = null;
  mathSymbolsModalInsertBtn.disabled = true;
  mathSymbolsModalInsertBtn.style.cursor = 'not-allowed';
};
mathSymbolsModalBg.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    mathSymbolsModalBg.classList.remove('show');
    selectedSymbolRow = null;
    selectedSymbolCode = null;
    mathSymbolsModalInsertBtn.disabled = true;
    mathSymbolsModalInsertBtn.style.cursor = 'not-allowed';
  }

  if (e.key === 'Enter') {
    // If focus is on the cancel button, activate cancel instead of insert
    if (document.activeElement === mathSymbolsModalCancelBtn) {
      mathSymbolsModalCancelBtn.click();
      return;
    }
    if (selectedSymbolRow && !mathSymbolsModalInsertBtn.disabled) {
      e.preventDefault();
      mathSymbolsModalInsertBtn.click();
      return;
    }
  }

  if (e.key === 'Escape') {
    mathSymbolsModalCancelBtn.click();
  }

  if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
    const rows = Array.from(mathSymbolsTable.querySelectorAll('tr'));
    if (!rows.length) return;
    let idx = selectedSymbolRow ? rows.indexOf(selectedSymbolRow) : -1;
    if (e.key === 'ArrowDown') idx = Math.min(idx + 1, rows.length - 1);
    if (e.key === 'ArrowUp') idx = Math.max(idx - 1, 0);
    if (rows[idx]) {
      selectSymbolRow(rows[idx], rows[idx].querySelectorAll('td')[1].textContent);
      rows[idx].focus();
    }
    e.preventDefault();
  }

  if (e.key === 'Tab') {
    const rows = Array.from(mathSymbolsTable.querySelectorAll('tr'));
    const focusables = [
      mathSymbolsSearch,
      ...rows,
      mathSymbolsModalCancelBtn
    ].filter(Boolean);

    if (!focusables.length) return;

    e.preventDefault();
    e.stopPropagation();

    let activeEl = document.activeElement;
    if (!focusables.includes(activeEl)) {
      const rowEl = activeEl?.closest?.('tr');
      if (rowEl && focusables.includes(rowEl)) activeEl = rowEl;
    }

    let idx = focusables.indexOf(activeEl);
    if (e.shiftKey) {
      idx = (idx <= 0) ? focusables.length - 1 : idx - 1;
    } else {
      idx = (idx === -1 || idx === focusables.length - 1) ? 0 : idx + 1;
    }

    const nextEl = focusables[idx];
    nextEl.focus();
    mathSymbolsModalBg.classList.add('keyboard-nav');

    if (rows.includes(nextEl)) {
      const codeCell = nextEl.querySelectorAll('td')[1];
      if (codeCell) selectSymbolRow(nextEl, codeCell.textContent);
    } else if (selectedSymbolRow) {
      selectedSymbolRow.classList.remove('selected');
      selectedSymbolRow = null;
      selectedSymbolCode = null;
      mathSymbolsModalInsertBtn.disabled = true;
      mathSymbolsModalInsertBtn.style.cursor = 'not-allowed';
    }
  }
});

// Add: only show keyboard focus styles when user is tabbing (not when clicking)
(function() {
  // When user presses Tab, mark that they're using keyboard navigation
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
      // Reinstall a listener to detect mouse use afterwards
      window.addEventListener('mousedown', handleMouseDownOnce, { once: true });
      window.addEventListener('touchstart', handleMouseDownOnce, { once: true });
    }
  }

  function handleMouseDownOnce() {
    document.body.classList.remove('user-is-tabbing');
    // Reinstall the initial Tab listener
    window.addEventListener('keydown', handleFirstTab);
  }

  // Start listening
  window.addEventListener('keydown', handleFirstTab);
})();

// --- NOTE DATA, SELECTION, AND STORAGE ---
let currentNoteKey = null;
let noteIdCounter = 1;
const notesData = {};
function generateNoteId() {
  return 'note-' + (noteIdCounter++);
}

const deletedNotes = new Set();

function markDescendantsDeleted(noteId) {
  deletedNotes.add(noteId);
  for (const id in notesData) {
    if (notesData[id].parent === noteId) {
      markDescendantsDeleted(id);
    }
  }
}

function isNoteOrAncestorDeleted(noteId) {
  let cur = noteId;
  while (cur) {
    if (deletedNotes.has(cur)) return true;
    cur = notesData[cur]?.parent;
  }
  return false;
}

function isNoteSelectedAndEditable() {
  return (
    currentNoteKey &&
    notesData[currentNoteKey] &&
    !notesData[currentNoteKey].inTrash &&
    currentNoteKey !== TRASH_ID &&
    !isNoteOrAncestorDeleted(currentNoteKey)
  );
}

const markdownInput = document.getElementById('markdownInput');
const previewPane = document.getElementById('previewPane');
const editorPane = document.getElementById('editorPane');

function renderMarkdownWithMath(text) {
  const html = marked.parse(text || '');
  previewPane.innerHTML = html;
  if (window.MathJax) {
    MathJax.typesetPromise([previewPane]);
  }
}

markdownInput.addEventListener('input', () => {
  renderMarkdownWithMath(markdownInput.value);
  if (currentNoteKey && notesData[currentNoteKey] && !isNoteOrAncestorDeleted(currentNoteKey)) {
    notesData[currentNoteKey].content = markdownInput.value;
  }
});

function updateNoteContentEditable() {
  if (!currentNoteKey || !notesData[currentNoteKey] || isNoteOrAncestorDeleted(currentNoteKey)) {
    editorPane.classList.add('disabled');
    previewPane.classList.add('disabled');
    markdownInput.value = '## No note is currently selected';
    previewPane.innerHTML = '<h2>No note is currently selected</h2>';
    markdownInput.setAttribute('readonly', 'readonly');
    markdownInput.setAttribute('placeholder', '');
    if (mathSymbolsModalBg && mathSymbolsModalInsertBtn) {
      mathSymbolsModalInsertBtn.disabled = true;
      mathSymbolsModalInsertBtn.style.cursor = 'not-allowed';
    }
  } else {
    editorPane.classList.remove('disabled');
    previewPane.classList.remove('disabled');
    markdownInput.removeAttribute('readonly');
    markdownInput.value = notesData[currentNoteKey]?.content || '';
    renderMarkdownWithMath(markdownInput.value);
    markdownInput.setAttribute('placeholder', 'Type Markdown + LaTeX here...');
    if (mathSymbolsModalBg && mathSymbolsModalInsertBtn) {
      const enable = selectedSymbolRow && isNoteSelectedAndEditable();
      mathSymbolsModalInsertBtn.disabled = !enable;
      mathSymbolsModalInsertBtn.style.cursor = enable ? '' : 'not-allowed';
    }
  }
}

addNoteBtn.addEventListener('click', async () => {
  const noteName = await showModal({ title: 'Title:', initialValue: '', depth: 0 });
  if (!noteName) return;
  const li = createNotebookElement(noteName);
  noteList.appendChild(li);
  ensureTrashAtBottom();
});

function createNotebookElement(notebookName, existingId = null) {
  const notebookId = existingId || generateNoteId();
  if (!notesData[notebookId]) {
    notesData[notebookId] = { content: '', title: notebookName, parent: null };
  } else {
    notesData[notebookId].title = notebookName;
    notesData[notebookId].parent = null;
    delete notesData[notebookId].inTrash;
    delete notesData[notebookId].originalParent;
  }
  const li = document.createElement('li');
  li.classList.add('has-notes');
  li.setAttribute('data-note-id', notebookId);
  const leftGroup = document.createElement('div');
  leftGroup.className = 'left-group';
  const arrow = document.createElement('span');
  arrow.classList.add('arrow');
  arrow.textContent = '';
  arrow.style.display = 'inline-block';
  arrow.style.width = '1em';
  arrow.style.minWidth = '1em';
  arrow.style.textAlign = 'center';
  arrow.style.marginRight = '4px';
  arrow.style.color = 'white';
  arrow.style.fontSize = '0.75rem';
  arrow.style.marginLeft = '0';
  arrow.style.visibility = 'hidden';
  arrow.style.pointerEvents = 'none';

  // --- ADDED: accessible role, initial tabIndex, and keyboard handler ---
  arrow.setAttribute('role', 'button');
  arrow.tabIndex = -1; // observer will flip to 0 when visible
  arrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      // toggle open/close but do NOT move focus into subnotes
      toggleNotes(arrow);
    }
  });

  leftGroup.appendChild(arrow);
  const title = document.createElement('span');
  title.classList.add('title');
  title.textContent = notebookName;
  const subCount = document.createElement('span');
  subCount.className = 'subnote-count';
  subCount.style.color = '#bbb';
  subCount.style.fontSize = '0.75em';
  subCount.style.marginLeft = '4px';
  subCount.style.fontWeight = '400';
  subCount.style.display = 'none';
  leftGroup.appendChild(title);
  leftGroup.appendChild(subCount);
  const actions = document.createElement('div');
  actions.classList.add('actions');
  const editTitleBtn = document.createElement('button');
  editTitleBtn.textContent = "✎";
  editTitleBtn.title = "Edit Title";
  editTitleBtn.className = "edit-title-btn";
  editTitleBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const newTitle = await showModal({ title: 'Title:', initialValue: title.textContent, depth: 0 });
    if (newTitle) {
      title.textContent = newTitle;
      notesData[notebookId].title = newTitle;
    }
  });
  const addBtn = document.createElement('button');
  addBtn.textContent = '+';
  addBtn.title = "Add Note";
  addBtn.className = "plus-btn";
  addBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const noteName = await showModal({ title: 'Title:', initialValue: '', depth: 1 });
    if (!noteName) return;
    const notesList = li.querySelector('.notes');
    const noteEl = createNoteElement(noteName, notebookId);
    notesList.appendChild(noteEl);
    if (!li.classList.contains('open')) {
      li.classList.add('open');
      arrow.textContent = '▼';
    }
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '-';
  deleteBtn.title = "Delete Notebook";
  deleteBtn.className = "minus-btn";
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const confirmed = await showDeleteModal(title.textContent);
    if (!confirmed) return;

    moveToTrash(notebookId);
    li.remove();
    setActiveHeader(null);
    if (currentNoteKey === notebookId || isNoteOrAncestorDeleted(currentNoteKey)) {
      currentNoteKey = null;
    }
    updateNoteContentEditable();
    ensureTrashAtBottom();
  });

  actions.appendChild(editTitleBtn);
  actions.appendChild(addBtn);
  actions.appendChild(deleteBtn);

  const header = document.createElement('div');
  header.classList.add('note-header');
  header.appendChild(leftGroup);
  header.appendChild(actions);

  // --- ADDED: make header keyboard-focusable but DO NOT intercept button events ---
  header.tabIndex = 0;
  header.setAttribute('role', 'button');
  header.addEventListener('keydown', function (e) {
    // If the key event originated from a button/control inside the header, ignore it
    if (e.target.closest && (e.target.closest('.actions') || e.target.tagName === 'BUTTON')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      header.click();
    }
  });

  header.setAttribute('draggable', 'true');
  header.addEventListener('dragstart', e => {
    li.classList.add('dragging');
    window.__draggedNote = li;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });
  header.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    window.__draggedNote = null;
  });
  header.addEventListener('click', function (e) {
    if (
      e.target.closest('.actions') ||
      e.target.tagName === 'BUTTON' ||
      e.target.classList.contains('arrow')
    ) return;
    setActiveHeader(header);
    selectNote(notebookId);
  });
  const notesList = document.createElement('ul');
  notesList.classList.add('notes');
  li.appendChild(header);
  li.appendChild(notesList);
  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dragged = window.__draggedNote;
    if (!dragged || dragged === li) {
      // remove any residual hints
      li.classList.remove('drop-above', 'drop-inside', 'drop-below');
      return;
    }
    // prevent showing drop hints if dropping into own descendant
    if (dragged.contains(li)) {
      li.classList.remove('drop-above', 'drop-inside', 'drop-below');
      return;
    }

    const rect = li.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const h = Math.max(rect.height, 1);
    const topZone = h * 0.25;
    const bottomZone = h * 0.75;

    // clear existing
    li.classList.remove('drop-above', 'drop-inside', 'drop-below');

    if (offsetY < topZone) {
      li.classList.add('drop-above');
    } else if (offsetY > bottomZone) {
      li.classList.add('drop-below');
    } else {
      li.classList.add('drop-inside');
    }
  });

  li.addEventListener('dragleave', (e) => {
    // Remove hints when leaving the li
    // Some browsers fire dragleave when moving between children, so check relatedTarget
    li.classList.remove('drop-above', 'drop-inside', 'drop-below');
  });

  // REPLACED: smarter drop handling (top 25% = above, middle 50% = inside, bottom 25% = below)
  li.addEventListener('drop', e => {
    e.preventDefault();
    const targetLi = li;
    const dragged = window.__draggedNote;
    // clear visual cues immediately
    targetLi.classList.remove('drop-above', 'drop-inside', 'drop-below');

    if (!dragged || dragged === targetLi) return;

    // Don't allow dropping onto a descendant of the dragged node
    if (dragged.contains(targetLi)) return;

    const rect = targetLi.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const h = rect.height || 1;
    const topZone = h * 0.25;
    const bottomZone = h * 0.75;

    const draggedId = dragged.getAttribute && dragged.getAttribute('data-note-id');

    if (offsetY < topZone) {
      // Insert above target in same list
      const parentUl = targetLi.parentNode;
      parentUl.insertBefore(dragged, targetLi);
      const parentLi = parentUl.closest && parentUl.closest('li.has-notes');
      const newParentId = parentLi ? parentLi.getAttribute('data-note-id') : null;
      if (draggedId) notesData[draggedId].parent = newParentId;
    } else if (offsetY > bottomZone) {
      // Insert below target in same list
      const parentUl = targetLi.parentNode;
      parentUl.insertBefore(dragged, targetLi.nextSibling);
      const parentLi = parentUl.closest && parentUl.closest('li.has-notes');
      const newParentId = parentLi ? parentLi.getAttribute('data-note-id') : null;
      if (draggedId) notesData[draggedId].parent = newParentId;
    } else {
      // Middle: drop inside target => become its child
      let notesList = targetLi.querySelector('.notes');
      if (!notesList) {
        notesList = document.createElement('ul');
        notesList.classList.add('notes');
        targetLi.appendChild(notesList);
      }
      notesList.appendChild(dragged);
      targetLi.classList.add('open');
      const targetArrow = targetLi.querySelector('.arrow');
      if (targetArrow) targetArrow.textContent = '▼';
      if (draggedId) notesData[draggedId].parent = targetLi.getAttribute('data-note-id');
    }

    // Clear dragging state
    if (dragged.classList) dragged.classList.remove('dragging');
    window.__draggedNote = null;
  });

  const updateSubCount = () => {
    const count = notesList.children.length;
    if (count > 0) {
      subCount.textContent = `(${count})`;
      subCount.style.display = '';
    } else {
      subCount.textContent = '';
      subCount.style.display = 'none';
    }
  };
  const observer = new MutationObserver(() => {
    if (notesList.children.length > 0) {
      arrow.textContent = li.classList.contains('open') ? '▼' : '▶';
      arrow.style.visibility = 'visible';
      arrow.style.pointerEvents = 'auto';
      arrow.style.cursor = 'pointer';
      // make arrow tabbable when visible
      arrow.tabIndex = 0;
      arrow.onclick = function(e) {
        e.stopPropagation();
        toggleNotes(arrow);
        arrow.textContent = li.classList.contains('open') ? '▼' : '▶';
      };
    } else {
      arrow.textContent = '';
      arrow.style.visibility = 'hidden';
      arrow.style.pointerEvents = 'none';
      // remove from tab order when hidden
      arrow.tabIndex = -1;
      arrow.onclick = null;
      li.classList.remove('open');
    }
    updateSubCount();
  });
  observer.observe(notesList, { childList: true });
  updateSubCount();
  return li;
}

function createNoteElement(noteName, parentNotebookId, existingId = null) {
  const noteId = existingId || generateNoteId();
  if (!notesData[noteId]) {
    notesData[noteId] = { content: '', title: noteName, parent: parentNotebookId };
  } else {
    notesData[noteId].title = noteName;
    notesData[noteId].parent = parentNotebookId;
    delete notesData[noteId].inTrash;
    delete notesData[noteId].originalParent;
  }
  const li = document.createElement('li');
  li.classList.add('has-notes');
  li.setAttribute('data-note-id', noteId);
  const leftGroup = document.createElement('div');
  leftGroup.className = 'left-group';
  const arrow = document.createElement('span');
  arrow.classList.add('arrow');
  arrow.textContent = '';
  arrow.style.display = 'inline-block';
  arrow.style.width = '1em';
  arrow.style.minWidth = '1em';
  arrow.style.textAlign = 'center';
  arrow.style.marginRight = '4px';
  arrow.style.color = 'white';
  arrow.style.fontSize = '0.75rem';
  arrow.style.marginLeft = '0';
  arrow.style.visibility = 'hidden';
  arrow.style.pointerEvents = 'none';

  // --- ADDED: accessible role, initial tabIndex, keyboard handler ---
  arrow.setAttribute('role', 'button');
  arrow.tabIndex = -1;
  arrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleNotes(arrow);
    }
  });

  leftGroup.appendChild(arrow);
  const title = document.createElement('span');
  title.classList.add('title');
  title.textContent = noteName;
  const subCount = document.createElement('span');
  subCount.className = 'subnote-count';
  subCount.style.color = '#bbb';
  subCount.style.fontSize = '.75em';
  subCount.style.marginLeft = '4px';
  subCount.style.fontWeight = '400';
  subCount.style.display = 'none';
  leftGroup.appendChild(title);
  leftGroup.appendChild(subCount);
  const actions = document.createElement('div');
  actions.classList.add('actions');
  const editTitleBtn = document.createElement('button');
  editTitleBtn.textContent = "✎";
  editTitleBtn.title = "Edit Title";
  editTitleBtn.className = "edit-title-btn";
  const depth = getDepth(noteId);
  editTitleBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const newTitle = await showModal({ title: 'Title:', initialValue: title.textContent, depth });
    if (newTitle) {
      title.textContent = newTitle;
      notesData[noteId].title = newTitle;
    }
  });
  const addBtn = document.createElement('button');
  addBtn.textContent = '+';
  addBtn.title = "Add Note";
  addBtn.className = "plus-btn";
  addBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const newNoteName = await showModal({ title: 'Title:', initialValue: '', depth: depth + 1 });
    if (!newNoteName) return;
    const notesList = li.querySelector('.notes');
    const noteEl = createNoteElement(newNoteName, noteId);
    notesList.appendChild(noteEl);
    if (!li.classList.contains('open')) {
      li.classList.add('open');
      arrow.textContent = '▼';
    }
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '-';
  deleteBtn.title = "Delete Note";
  deleteBtn.className = "minus-btn";
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const confirmed = await showDeleteModal(title.textContent);
    if (!confirmed) return;

    moveToTrash(noteId);
    li.remove();
    setActiveHeader(null);
    if (currentNoteKey === noteId || isNoteOrAncestorDeleted(currentNoteKey)) {
      currentNoteKey = null;
    }
    updateNoteContentEditable();
    ensureTrashAtBottom();
  });

  actions.appendChild(editTitleBtn);
  actions.appendChild(addBtn);
  actions.appendChild(deleteBtn);

  const header = document.createElement('div');
  header.classList.add('note-header');
  header.appendChild(leftGroup);
  header.appendChild(actions);

  // --- ADDED: header tabbable but ignore key events from inner buttons ---
  header.tabIndex = 0;
  header.setAttribute('role', 'button');
  header.addEventListener('keydown', function (e) {
    if (e.target.closest && (e.target.closest('.actions') || e.target.tagName === 'BUTTON')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      header.click();
    }
  });

  header.setAttribute('draggable', 'true');
  header.addEventListener('dragstart', e => {
    li.classList.add('dragging');
    window.__draggedNote = li;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });
  header.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    window.__draggedNote = null;
  });
  header.addEventListener('click', function (e) {
    if (
      e.target.closest('.actions') ||
      e.target.tagName === 'BUTTON' ||
      e.target.classList.contains('arrow')
    ) return;
    setActiveHeader(header);
    selectNote(noteId);
  });
  const notesList = document.createElement('ul');
  notesList.classList.add('notes');
  li.appendChild(header);
  li.appendChild(notesList);
  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dragged = window.__draggedNote;
    if (!dragged || dragged === li) {
      // remove any residual hints
      li.classList.remove('drop-above', 'drop-inside', 'drop-below');
      return;
    }
    // prevent showing drop hints if dropping into own descendant
    if (dragged.contains(li)) {
      li.classList.remove('drop-above', 'drop-inside', 'drop-below');
      return;
    }

    const rect = li.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const h = Math.max(rect.height, 1);
    const topZone = h * 0.25;
    const bottomZone = h * 0.75;

    // clear existing
    li.classList.remove('drop-above', 'drop-inside', 'drop-below');

    if (offsetY < topZone) {
      li.classList.add('drop-above');
    } else if (offsetY > bottomZone) {
      li.classList.add('drop-below');
    } else {
      li.classList.add('drop-inside');
    }
  });

  li.addEventListener('dragleave', (e) => {
    // Remove hints when leaving the li
    // Some browsers fire dragleave when moving between children, so check relatedTarget
    li.classList.remove('drop-above', 'drop-inside', 'drop-below');
  });

  // REPLACED: smarter drop handling (top 25% = above, middle 50% = inside, bottom 25% = below)
  li.addEventListener('drop', e => {
    e.preventDefault();
    const targetLi = li;
    const dragged = window.__draggedNote;
    // clear visual cues immediately
    targetLi.classList.remove('drop-above', 'drop-inside', 'drop-below');

    if (!dragged || dragged === targetLi) return;

    // Don't allow dropping onto a descendant of the dragged node
    if (dragged.contains(targetLi)) return;

    const rect = targetLi.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const h = rect.height || 1;
    const topZone = h * 0.25;
    const bottomZone = h * 0.75;

    const draggedId = dragged.getAttribute && dragged.getAttribute('data-note-id');

    if (offsetY < topZone) {
      // Insert above target in same list
      const parentUl = targetLi.parentNode;
      parentUl.insertBefore(dragged, targetLi);
      const parentLi = parentUl.closest && parentUl.closest('li.has-notes');
      const newParentId = parentLi ? parentLi.getAttribute('data-note-id') : null;
      if (draggedId) notesData[draggedId].parent = newParentId;
    } else if (offsetY > bottomZone) {
      // Insert below target in same list
      const parentUl = targetLi.parentNode;
      parentUl.insertBefore(dragged, targetLi.nextSibling);
      const parentLi = parentUl.closest && parentUl.closest('li.has-notes');
      const newParentId = parentLi ? parentLi.getAttribute('data-note-id') : null;
      if (draggedId) notesData[draggedId].parent = newParentId;
    } else {
      // Middle: drop inside target => become its child
      let notesList = targetLi.querySelector('.notes');
      if (!notesList) {
        notesList = document.createElement('ul');
        notesList.classList.add('notes');
        targetLi.appendChild(notesList);
      }
      notesList.appendChild(dragged);
      targetLi.classList.add('open');
      const targetArrow = targetLi.querySelector('.arrow');
      if (targetArrow) targetArrow.textContent = '▼';
      if (draggedId) notesData[draggedId].parent = targetLi.getAttribute('data-note-id');
    }

    // Clear dragging state
    if (dragged.classList) dragged.classList.remove('dragging');
    window.__draggedNote = null;
  });

  const updateSubCount = () => {
    const count = notesList.children.length;
    if (count > 0) {
      subCount.textContent = `(${count})`;
      subCount.style.display = '';
    } else {
      subCount.textContent = '';
      subCount.style.display = 'none';
    }
  };
  const observer = new MutationObserver(() => {
    if (notesList.children.length > 0) {
      arrow.textContent = li.classList.contains('open') ? '▼' : '▶';
      arrow.style.visibility = 'visible';
      arrow.style.pointerEvents = 'auto';
      arrow.style.cursor = 'pointer';
      // make arrow tabbable when visible
      arrow.tabIndex = 0;
      arrow.onclick = function(e) {
        e.stopPropagation();
        toggleNotes(arrow);
        arrow.textContent = li.classList.contains('open') ? '▼' : '▶';
      };
    } else {
      arrow.textContent = '';
      arrow.style.visibility = 'hidden';
      arrow.style.pointerEvents = 'none';
      // remove from tab order when hidden
      arrow.tabIndex = -1;
      arrow.onclick = null;
      li.classList.remove('open');
    }
    updateSubCount();
  });
  observer.observe(notesList, { childList: true });
  updateSubCount();
  return li;
}

function rebuildNoteTree(noteId, li) {
  const notesList = li.querySelector('.notes');
  if (!notesList) return;
  for (const id in notesData) {
    const child = notesData[id];
    if (!child || child.inTrash || child.parent !== noteId) continue;
    const childLi = createNoteElement(child.title, noteId, id);
    notesList.appendChild(childLi);
    rebuildNoteTree(id, childLi);
  }
}

function selectNote(noteId) {
  if (currentNoteKey && notesData[currentNoteKey] && !isNoteOrAncestorDeleted(currentNoteKey)) {
    notesData[currentNoteKey].content = markdownInput.value;
  }
  currentNoteKey = noteId;

  if (noteId === TRASH_ID) {
    editorPane.classList.add('disabled');
    previewPane.classList.add('disabled');
    markdownInput.value = '';
    previewPane.innerHTML = '<h2>🗑️ Trash</h2><p>Deleted items appear here. Use "Recover" to restore them or "-" to delete permanently.</p>';
    markdownInput.setAttribute('readonly', 'readonly');
    markdownInput.setAttribute('placeholder', '');
    updatePreviewOnlyBtnVisibility();
    return;
  }

  if (notesData[noteId]?.inTrash) {
    editorPane.classList.add('disabled');
    previewPane.classList.add('disabled');
    markdownInput.value = notesData[noteId]?.content || '';
    renderMarkdownWithMath(markdownInput.value);
    markdownInput.setAttribute('readonly', 'readonly');
    markdownInput.setAttribute('placeholder', '');
    updatePreviewOnlyBtnVisibility();
    return;
  }

  updateNoteContentEditable();
  if (mathSymbolsModalBg && mathSymbolsModalInsertBtn) {
    const enable = selectedSymbolRow && isNoteSelectedAndEditable();
    mathSymbolsModalInsertBtn.disabled = !enable;
    mathSymbolsModalInsertBtn.style.cursor = enable ? '' : 'not-allowed';
  }
}

updateNoteContentEditable();

function toggleNotes(el) {
  const parent = el.closest('li');
  parent.classList.toggle('open');
  if (!parent.classList.contains('open')) {
    parent.querySelectorAll('li.has-notes').forEach(li => {
      li.classList.remove('open');
      const arrow = li.querySelector('.arrow');
      if (arrow) {
        const notesList = li.querySelector('.notes');
        arrow.textContent = (notesList && notesList.children.length > 0) ? '▶' : '';
      }
    });
  }
  const arrow = parent.querySelector('.arrow');
  if (arrow) {
    const notesList = parent.querySelector('.notes');
    arrow.textContent = parent.classList.contains('open')
      ? '▼'
      : (notesList && notesList.children.length > 0 ? '▶' : '');
  }
}

let currentActiveHeader = null;
function setActiveHeader(header) {
  if (currentActiveHeader) currentActiveHeader.classList.remove('active');
  currentActiveHeader = header;
  if (header) header.classList.add('active');
}

let isResizing = false;
sidebarResizer.addEventListener('mousedown', function () {
  isResizing = true;
  document.body.style.cursor = 'ew-resize';
});
document.addEventListener('mousemove', function (e) {
  if (!isResizing) return;
  const layoutRect = document.querySelector('.layout-container').getBoundingClientRect();
  let newWidth = e.clientX - layoutRect.left - 14;
  const minSidebar = 110;
  const maxSidebar = window.innerWidth - 900;
  if (newWidth > minSidebar && newWidth < maxSidebar) {

    sidebar.style.width = newWidth + 'px';
  }
});
document.addEventListener('mouseup', function () {
  isResizing = false;
  document.body.style.cursor = '';
});

const mainSplit = document.getElementById('mainSplit');
let previewOnly = false;

function togglePreviewMode() {
  previewOnly = !previewOnly;
  if (previewOnly) {
    mainSplit.classList.add('preview-only');
  } else {
    mainSplit.classList.remove('preview-only');
  }
}

if (window.require) {
  try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('menu-toggle-preview', () => {
      togglePreviewMode();
    });
  } catch (error) {
    console.error('Failed to set up IPC communication:', error);
  }
}

function updatePreviewOnlyBtnVisibility() {}

const _updateNoteContentEditable = updateNoteContentEditable;
updateNoteContentEditable = function() {
  _updateNoteContentEditable.apply(this, arguments);
  updatePreviewOnlyBtnVisibility();
};

const TRASH_ID = 'trash-notebook';

function moveToTrash(noteId, isNested = false) {
  const note = notesData[noteId];
  if (!note) return [];

  if (!Object.prototype.hasOwnProperty.call(note, 'originalParent')) {
    note.originalParent = note.parent;
  }
  if (!isNested) note.parent = TRASH_ID;

  note.inTrash = true;

  const trashedIds = [noteId];
  for (const id in notesData) {
    if (notesData[id]?.parent === noteId) {
      trashedIds.push(...moveToTrash(id, true));
    }
  }
  return trashedIds;
}

function recoverFromTrash(noteId) {
  const note = notesData[noteId];
  if (!note || !note.inTrash) return;

  const restoredParent = Object.prototype.hasOwnProperty.call(note, 'originalParent')
    ? note.originalParent
    : null;

  note.parent = restoredParent;
  delete note.originalParent;
  delete note.inTrash;

  for (const id in notesData) {
    if (notesData[id]?.inTrash && notesData[id]?.originalParent === noteId) {
      recoverFromTrash(id);
    }
  }
}

function permanentlyDelete(noteId) {
  if (!notesData[noteId]) return;

  const descendantIds = [];
  findAllDescendants(noteId, descendantIds);

  descendantIds.forEach(id => {
    delete notesData[id];
  });

  delete notesData[noteId];
}

function findAllDescendants(noteId, collectionArray) {
  for (const id in notesData) {
    if (notesData[id] && notesData[id].parent === noteId) {
      collectionArray.push(id);
      findAllDescendants(id, collectionArray);
    }
  }
}

function createTrashNotebook() {
  notesData[TRASH_ID] = { content: '', title: 'Trash', parent: null, isTrash: true };
  const li = document.createElement('li');
  li.classList.add('has-notes', 'trash-notebook');
  li.id = TRASH_ID;
  li.setAttribute('data-note-id', TRASH_ID);

  const leftGroup = document.createElement('div');
  leftGroup.className = 'left-group';

  const arrow = document.createElement('span');
  arrow.classList.add('arrow');
  arrow.textContent = '';
  arrow.style.display = 'inline-block';
  arrow.style.width = '1em';
  arrow.style.minWidth = '1em';
  arrow.style.textAlign = 'center';
  arrow.style.marginRight = '4px';
  arrow.style.color = 'white';
  arrow.style.fontSize = '0.75rem';
  arrow.style.marginLeft = '0';
  arrow.style.visibility = 'hidden';
  arrow.style.pointerEvents = 'none';

  arrow.setAttribute('role', 'button');
  arrow.tabIndex = -1;
  arrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleNotes(arrow);
    }
  });
  leftGroup.appendChild(arrow);

  const trashIcon = document.createElement('span');
  trashIcon.style.marginRight = '6px';
  trashIcon.style.display = 'inline-block';
  trashIcon.style.verticalAlign = 'middle';
  trashIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`;
  const title = document.createElement('span');
  title.classList.add('title');
  title.textContent = 'Trash';
  title.style.fontWeight = 'bold';
  title.style.verticalAlign = 'middle';

  const subCount = document.createElement('span');
  subCount.className = 'subnote-count';
  subCount.style.color = '#bbb';
  subCount.style.fontSize = '0.75em';
  subCount.style.marginLeft = '4px';
  subCount.style.fontWeight = '400';
  subCount.style.display = 'none';

  leftGroup.appendChild(trashIcon);
  leftGroup.appendChild(title);
  leftGroup.appendChild(subCount);

  const header = document.createElement('div');
  header.classList.add('note-header');
  header.appendChild(leftGroup);
  header.style.cursor = 'default';

  const notesList = document.createElement('ul');
  notesList.classList.add('notes');
  li.appendChild(header);
  li.appendChild(notesList);

  const observer = new MutationObserver(() => {
    const count = notesList.children.length;
    if (count > 0) {
      arrow.textContent = li.classList.contains('open') ? '▼' : '▶';
      arrow.style.visibility = 'visible';
      arrow.style.pointerEvents = 'auto';
      arrow.style.cursor = 'pointer';
      arrow.tabIndex = 0;
      arrow.onclick = function(e) {
        e.stopPropagation();
        toggleNotes(arrow);
        arrow.textContent = li.classList.contains('open') ? '▼' : '▶';
      };
      subCount.textContent = `(${count})`;
      subCount.style.display = '';
    } else {
      arrow.textContent = '';
      arrow.style.visibility = 'hidden';
      arrow.style.pointerEvents = 'none';
      arrow.tabIndex = -1;
      arrow.onclick = null;
      li.classList.remove('open');
      subCount.textContent = '';
      subCount.style.display = 'none';
    }
  });
  observer.observe(notesList, { childList: true });

  return li;
}

function createTrashedElement(noteId) {
  const note = notesData[noteId];
  if (!note) return null;

  const li = document.createElement('li');
  li.classList.add('trashed-item', 'has-notes');
  li.setAttribute('data-note-id', noteId);

  const leftGroup = document.createElement('div');
  leftGroup.className = 'left-group';

  const arrow = document.createElement('span');
  arrow.classList.add('arrow');
  arrow.textContent = '';
  arrow.style.display = 'inline-block';
  arrow.style.width = '1em';
  arrow.style.minWidth = '1em';
  arrow.style.textAlign = 'center';
  arrow.style.marginRight = '4px';
  arrow.style.color = 'white';
  arrow.style.fontSize = '0.75rem';
  arrow.style.marginLeft = '0';
  arrow.style.visibility = 'hidden';
  arrow.style.pointerEvents = 'none';

  // --- ADDED: accessible role, initial tabIndex, keyboard handler ---
  arrow.setAttribute('role', 'button');
  arrow.tabIndex = -1;
  arrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleNotes(arrow);
    }
  });

  leftGroup.appendChild(arrow);

  const title = document.createElement('span');
  title.classList.add('title');
  title.textContent = note.title;
  title.style.color = '#999';
  title.style.textDecoration = 'none';
  leftGroup.appendChild(title);

  const actions = document.createElement('div');
  actions.classList.add('actions');

  const recoverBtn = document.createElement('button');
  recoverBtn.textContent = 'Recover';
  recoverBtn.title = "Recover Item";
  recoverBtn.className = "plus-btn";
  recoverBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (recoverBtn.disabled) return;
    recoverBtn.disabled = true;

    const noteData = notesData[noteId];
    if (!noteData) return;
    noteData.originalParent = null;

    const wasSelected = currentNoteKey === noteId;
    recoverFromTrash(noteId);
    li.remove();

    const restoredElement = createNotebookElement(noteData.title, noteId);
    rebuildNoteTree(noteId, restoredElement);

    const trashNotebook = document.getElementById(TRASH_ID);
    noteList.insertBefore(restoredElement, trashNotebook || null);

    ensureTrashAtBottom();

    if (wasSelected) {
      const header = restoredElement.querySelector('.note-header');
      setActiveHeader(header);
      selectNote(noteId);
    }
  });

  const permanentDeleteBtn = document.createElement('button');
  permanentDeleteBtn.textContent = '-';
  permanentDeleteBtn.title = "Delete Permanently";
  permanentDeleteBtn.className = "minus-btn";
  permanentDeleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (!notesData[noteId]) {
      li.remove();
      ensureTrashAtBottom();
      return;
    }

    deleteModalTitle.textContent = `Are you sure you want to permanently delete "${note.title}"?`;
    deleteModalBg.classList.add('show');
    const confirmed = await new Promise((resolve) => { deleteModalResolve = resolve; });
    if (!confirmed) return;

    li.remove();

    if (currentNoteKey === noteId) {
      currentNoteKey = null;
      setActiveHeader(null);
      updateNoteContentEditable();
    }

    permanentlyDelete(noteId);
    ensureTrashAtBottom();

    const trashNotebook = document.getElementById(TRASH_ID);
    if (trashNotebook && trashNotebook.querySelector('.notes').children.length === 0) {
      trashNotebook.remove();
    }
  });

  actions.appendChild(recoverBtn);
  actions.appendChild(permanentDeleteBtn);

  const header = document.createElement('div');
  header.classList.add('note-header');
  header.appendChild(leftGroup);
  header.appendChild(actions);

  // Make trashed header keyboard-focusable but don't intercept button events
  header.tabIndex = 0;
  header.setAttribute('role', 'button');
  header.addEventListener('keydown', function(e) {
    if (e.target.closest && (e.target.closest('.actions') || e.target.tagName === 'BUTTON')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      header.click();
    }
  });

  // --- ADDED: allow clicking a trashed item's header to view it in the preview (read-only) ---
  header.addEventListener('click', function(e) {
    // don't react to clicks on action buttons or the arrow
    if (
      e.target.closest('.actions') ||
      e.target.tagName === 'BUTTON' ||
      e.target.classList.contains('arrow')
    ) return;
    setActiveHeader(header);
    selectNote(noteId);
  });

  li.appendChild(header);

  const notesList = document.createElement('ul');
  notesList.classList.add('notes');
  li.appendChild(notesList);

  Object.keys(notesData).forEach((childId) => {
    if (notesData[childId]?.parent === noteId && notesData[childId].inTrash) {
      const childEl = createTrashedElement(childId);
      if (childEl) notesList.appendChild(childEl);
    }
  });

  if (notesList.children.length > 0) {
    arrow.style.visibility = 'visible';
    arrow.style.pointerEvents = 'auto';
    arrow.tabIndex = 0;
    arrow.textContent = '▼';
    li.classList.add('open');
    arrow.onclick = function(e) {
      e.stopPropagation();
      toggleNotes(arrow);
      arrow.textContent = li.classList.contains('open') ? '▼' : '▶';
    };
  } else {
    arrow.textContent = '';
    arrow.style.visibility = 'hidden';
    arrow.style.pointerEvents = 'none';
    arrow.tabIndex = -1;
    arrow.onclick = null;
    li.classList.remove('open');
  }

  return li;
}

const originalCreateNotebookElement = createNotebookElement;
createNotebookElement = function(notebookName, existingId = null) {
  return originalCreateNotebookElement(notebookName, existingId);
};

const originalCreateNoteElement = createNoteElement;
createNoteElement = function(noteName, parentNotebookId, existingId = null) {
  return originalCreateNoteElement(noteName, parentNotebookId, existingId);
};

function ensureTrashAtBottom() {
  let hasTrashItems = false;
  const trashedItems = [];

  for (const id in notesData) {
    if (notesData[id] && notesData[id].inTrash) {
      hasTrashItems = true;
      trashedItems.push(id);
    }
  }

  let trashNotebook = document.getElementById(TRASH_ID);

  if (!hasTrashItems) {
    if (trashNotebook) trashNotebook.remove();
    if (notesData[TRASH_ID]) delete notesData[TRASH_ID];
    if (currentNoteKey === TRASH_ID || (currentNoteKey && notesData[currentNoteKey]?.inTrash)) {
      currentNoteKey = null;
      setActiveHeader(null);
      updateNoteContentEditable();
    }
    return;
  }

  if (!trashNotebook) {
    trashNotebook = createTrashNotebook();
    noteList.appendChild(trashNotebook);
  } else {
    trashNotebook.remove();
    noteList.appendChild(trashNotebook);
  }

  const trashNotesList = trashNotebook.querySelector('.notes');
  trashNotesList.innerHTML = '';
  trashedItems
    .filter(id => notesData[id]?.parent === TRASH_ID)
    .forEach(id => {
      const trashedElement = createTrashedElement(id);
      if (trashedElement) trashNotesList.appendChild(trashedElement);
    });
}

window.addEventListener('load', function() {
  ensureTrashAtBottom();
});

document.addEventListener('wheel', function(e) {
  if (
    mathSymbolsModalBg.classList.contains('show') &&
    !mathSymbolsDialog.contains(e.target)
  ) {
    const scrollable = mathSymbolsDialog.querySelector('.math-symbols-modal-content-scroll');
    if (scrollable) {
      scrollable.scrollTop += e.deltaY;
      e.preventDefault();
    }
  }
}, { passive: false });

markdownInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const value = markdownInput.value;
    const selStart = markdownInput.selectionStart;
    const selEnd = markdownInput.selectionEnd;

    const before = value.slice(0, selStart);
    const after = value.slice(selEnd);
    const lastLineBreak = before.lastIndexOf('\n');
    const lineStart = lastLineBreak + 1;
    const currentLine = before.slice(lineStart);

    const bulletRegex = /^(\s*)([-*+]|(\d+)\.)\s(\[[x ]\]\s)?/;
    const match = currentLine.match(bulletRegex);

    if (match) {
      e.preventDefault();

      const [fullMatch, indent, , numberedBullet] = match;

      if (currentLine.trim() === fullMatch.trim()) {
        markdownInput.value = before.slice(0, lineStart) + after;
        markdownInput.selectionStart = markdownInput.selectionEnd = lineStart;
      } else {
        let newBullet = match[0];
        if (numberedBullet) {
          const num = parseInt(numberedBullet, 10) + 1;
          const checkboxPart = match[4] || '';
          newBullet = `${indent}${num}. ${checkboxPart}`;
        }
        const insert = '\n' + newBullet;
        const newValue = before + insert + after;
        markdownInput.value = newValue;
        markdownInput.selectionStart = markdownInput.selectionEnd = selStart + insert.length;
      }

      renderMarkdownWithMath(markdownInput.value);
      if (currentNoteKey && notesData[currentNoteKey] && !isNoteOrAncestorDeleted(currentNoteKey)) {
        notesData[currentNoteKey].content = markdownInput.value;
      }
    }
  }
});

// --- Custom Background Modal Logic ---
const customBgModal = document.getElementById('customBgModal');
const customBgHex = document.getElementById('customBgHex');
const customBgSwatch = document.getElementById('customBgSwatch');
const customBgOkBtn = document.getElementById('customBgOkBtn');
const customBgCancelBtn = document.getElementById('customBgCancelBtn');

function updateCustomBgOkButtonState(normalizedValue) {
  const normalized = normalizedValue === undefined ? normalizeHex(customBgHex.value) : normalizedValue;
  const disabled = !normalized;
  customBgOkBtn.disabled = disabled;
  customBgOkBtn.style.cursor = disabled ? 'not-allowed' : '';
}

function normalizeHex(hex) {
  let h = (hex || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null;
  return '#' + h.toUpperCase();
}
function showCustomBgModal(initialHex = '#5A6E7F') {
  closeAllModals();
  const normalized = normalizeHex(initialHex) || '#5A6E7F';
  customBgHex.value = normalized;
  customBgSwatch.style.backgroundColor = normalized;
  customBgSwatch.classList.remove('invalid');
  updateCustomBgOkButtonState(normalized);
  customBgModal.classList.add('show');
  // Focus immediately (no 100ms timeout)
  focusAndPlaceCaretEnd(customBgHex);

  const enable = isNoteSelectedAndEditable();
  customTableInsertBtn.disabled = !enable;
  customTableInsertBtn.style.cursor = enable ? '' : 'not-allowed';
}
function closeCustomBgModal() {
  customBgModal.classList.remove('show');
}
function isValidHex(hex) {
  return normalizeHex(hex) !== null;
}

customBgHex.addEventListener('input', function() {
  let val = this.value.trim();
  if (!val.startsWith('#')) val = '#' + val.replace(/^#+/, '');
  if (val === '' || val === '#') {
    this.value = '#';
  } else {
    this.value = '#' + val.slice(1).replace(/#/g, '');
  }
  customBgSwatch.classList.remove('invalid');
  const normalized = normalizeHex(this.value);
  if (normalized) {
    customBgSwatch.style.backgroundColor = normalized;
    customBgSwatch.classList.remove('invalid');
  } else {
    customBgSwatch.style.backgroundColor = '';
    customBgSwatch.classList.add('invalid');
  }
  updateCustomBgOkButtonState(normalized);
  // ...existing code...
});
customBgHex.addEventListener('keydown', function(e) {
  if ((e.key === 'Backspace' && this.selectionStart <= 1) ||
      (e.key === 'ArrowLeft' && this.selectionStart <= 1)) {
    e.preventDefault();
    this.setSelectionRange(1, 1);
  }
  if (e.key === 'Delete' && this.selectionStart === 0) {
    e.preventDefault();
    this.setSelectionRange(1, 1);
  }
});
customBgOkBtn.onclick = () => {
  if (customBgOkBtn.disabled) return;
  const normalized = normalizeHex(customBgHex.value);
  if (normalized) {
    document.body.style.backgroundColor = normalized;
    localStorage.setItem('background-color', normalized.replace(/^#/, ''));
    customBgSwatch.style.backgroundColor = normalized;
    customBgSwatch.classList.remove('invalid');
    updateCustomBgOkButtonState(normalized);
    closeCustomBgModal();
  } else {
    customBgSwatch.style.backgroundColor = '';
    customBgSwatch.classList.add('invalid');
    updateCustomBgOkButtonState(null);
    customBgHex.focus();
    requestAnimationFrame(() => customBgHex.setSelectionRange(1, 1));
  }
};
customBgCancelBtn.onclick = closeCustomBgModal;
customBgModal.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (document.activeElement === customBgCancelBtn) {
      customBgCancelBtn.click();
    } else if (!customBgOkBtn.disabled) {
      customBgOkBtn.click();
    }
  } else if (e.key === 'Escape') {
    closeCustomBgModal();
  }
});
if (window.require) {
  try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('open-custom-background-modal', () => {
      const saved = localStorage.getItem('background-color') || '5A6E7F';
      showCustomBgModal('#' + saved);
    });
  } catch (error) {}
}

// --- CUSTOM TABLE INSERTION LOGIC ---
const customTableModalBg = document.getElementById('customTableModalBg');
const customTableRows = document.getElementById('customTableRows');
const customTableCols = document.getElementById('customTableCols');
const customTableCells = document.getElementById('customTableCells');
const customTableInsertBtn = document.getElementById('customTableInsertBtn');
const customTableCancelBtn = document.getElementById('customTableCancelBtn');

// --- added helper so focus always lands at the end (no full-selection flash) ---
function attachEndCaret(input) {
  if (!input) return;
  const isNumber = input.type === 'number';
  const placeAtEnd = (instant = false) => {
    const apply = () => {
      const value = input.value ?? '';
      try {
        if (isNumber) {
          const restore = value;
          input.value = '';
          input.value = restore;
        } else if (typeof input.setSelectionRange === 'function') {
          input.setSelectionRange(value.length, value.length);
          input.scrollLeft = input.scrollWidth;
        } else {
          input.value = '';
          input.value = value;
        }
      } catch (e) {
        input.value = '';
        input.value = value;
      }
    };
    if (instant) {
      apply();
      if (!isNumber) requestAnimationFrame(apply);
    } else {
      setTimeout(apply, 0);
    }
  };
  input.addEventListener('focus', () => placeAtEnd(true));
  input.addEventListener('mousedown', () => placeAtEnd(), { passive: true });
  input.addEventListener('touchstart', () => placeAtEnd(), { passive: true });
  input.addEventListener('mouseup', (ev) => {
    setTimeout(() => {
      try {
        if (input.selectionStart === 0 && input.selectionEnd === (input.value || '').length) {
          ev.preventDefault();
          placeAtEnd(true);
        }
      } catch (e) {
        placeAtEnd(true);
      }
    }, 0);
  });
}

attachEndCaret(customTableRows);
attachEndCaret(customTableCols);

function showCustomTableModal() {
  closeAllModals();
  customTableRows.value = 2;
  customTableCols.value = 2;
  renderCustomTableInputs();
  customTableModalBg.classList.add('show');
  // Focus immediately (no 100ms timeout)
  focusAndPlaceCaretEnd(customTableRows);

  const enable = isNoteSelectedAndEditable();
  customTableInsertBtn.disabled = !enable;
  customTableInsertBtn.style.cursor = enable ? '' : 'not-allowed';
}
function closeCustomTableModal() {
  customTableModalBg.classList.remove('show');
}

function renderCustomTableInputs() {
  const rows = Math.max(1, Math.min(20, parseInt(customTableRows.value, 10) || 2));
  const cols = Math.max(1, Math.min(10, parseInt(customTableCols.value, 10) || 2));
  let html = `<table>`;
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      html += `<td><input type="text" class="custom-table-input" data-row="${r}" data-col="${c}" placeholder="${r === 0 ? 'Header' : ''}"></td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  customTableCells.innerHTML = html;

  customTableCells.querySelectorAll('.custom-table-input').forEach(attachEndCaret);
}

function generateTableMarkdown(rows, cols, inputs) {
  const table = Array.from({length: rows}, () => Array(cols).fill(''));
  inputs.forEach(input => {
    const r = parseInt(input.getAttribute('data-row'), 10);
    const c = parseInt(input.getAttribute('data-col'), 10);
    table[r][c] = input.value || (r === 0 ? `Header ${c+1}` : '');
  });

  let md = '';
  md += '| ' + table[0].map(cell => cell || `Header`).join(' | ') + ' |\n';
  md += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';
  for (let r = 1; r < rows; r++) {
    md += '| ' + table[r].map(cell => cell || '').join(' | ') + ' |\n';
  }
  return md;
}

function insertTextAtCursor(textToInsert) {
  const start = markdownInput.selectionStart;
  const end = markdownInput.selectionEnd;
  const value = markdownInput.value;

  const needsLineBreakBefore = start > 0 && value.charAt(start - 1) !== '\n';
  const needsLineBreakAfter = end < value.length && value.charAt(end) !== '\n';

  const insertText = (needsLineBreakBefore ? '\n\n' : '') +
                     textToInsert +
                     (needsLineBreakAfter ? '\n' : '');

  markdownInput.value = value.substring(0, start) + insertText + value.substring(end);
  markdownInput.selectionStart = markdownInput.selectionEnd = start + insertText.length;
  markdownInput.focus();
  renderMarkdownWithMath(markdownInput.value);
  if (currentNoteKey && notesData[currentNoteKey] && !isNoteOrAncestorDeleted(currentNoteKey)) {
    notesData[currentNoteKey].content = markdownInput.value;
  }
}

customTableInsertBtn.onclick = function() {
  const rows = Math.max(1, Math.min(20, parseInt(customTableRows.value, 10) || 2));
  const cols = Math.max(1, Math.min(10, parseInt(customTableCols.value, 10) || 2));
  const inputs = customTableCells.querySelectorAll('input');
  const md = generateTableMarkdown(rows, cols, inputs);
  if (!markdownInput.readOnly) {
    insertTextAtCursor(md);
  }
  closeCustomTableModal();
};

customTableCancelBtn.onclick = closeCustomTableModal;
customTableModalBg.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeCustomTableModal();
  // If Enter pressed and focus is on Cancel, activate Cancel; otherwise Insert if enabled
  if (e.key === 'Enter') {
    if (document.activeElement === customTableCancelBtn) {
      customTableCancelBtn.click();
    } else if (!customTableInsertBtn.disabled) {
      customTableInsertBtn.click();
    }
  }
});

['input', 'change'].forEach(evt => {
  customTableRows.addEventListener(evt, renderCustomTableInputs);
  customTableCols.addEventListener(evt, renderCustomTableInputs);
});

if (window.require) {
  try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('menu-insert-custom-table', () => {
      showCustomTableModal();
    });
  } catch (error) {}
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;

  const openModal = document.querySelector('.modal-bg.show, .math-symbols-modal-bg.show');
  if (!openModal) return;

  const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
  const focusable = Array.from(openModal.querySelectorAll(focusableSelector))
    .filter(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');

  if (focusable.length === 0) return;

  const firstEl = focusable[0];
  const lastEl = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === firstEl) {
    e.preventDefault();
    lastEl.focus();
  } else if (!e.shiftKey && document.activeElement === lastEl) {
    e.preventDefault();
    firstEl.focus();
  } else if (!focusable.includes(document.activeElement)) {
    e.preventDefault();
    firstEl.focus();
  }
});
