import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  ListChecks,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { getCurrentUser } from '../../services/authService';
import { getProfiles, addProfile } from '../../features/shared/dataService';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import './ProfileEditorWorkspace.css';

const SAMPLE_TYPE_OPTIONS = ['SERUM', 'URINE', 'BLOOD', 'PLASMA', 'STOOL', 'WHOLE BLOOD', 'OTHER'];
const RESULT_TYPE_OPTIONS = [
  { value: 'number', label: 'Number' },
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Dropdown' }
];

const REFERENCE_MODE_OPTIONS = [
  { value: 'numeric', label: 'Numeric range' },
  { value: 'text', label: 'Text reference' },
  { value: 'positiveNegative', label: 'Positive / negative scale' },
  { value: 'custom', label: 'Custom multiline' }
];

const DEFAULT_DROPDOWN_OPTIONS = 'Negative\nPositive';
const DEFAULT_POSITIVE_NEGATIVE_SCALE = [
  { symbol: '-', label: 'Negative', value: '' },
  { symbol: '+/-', label: 'Positive', value: '15 mg/dL' },
  { symbol: '+', label: 'Positive', value: '30 mg/dL' },
  { symbol: '++', label: 'Positive', value: '100 mg/dL' },
  { symbol: '+++', label: 'Positive', value: '300 mg/dL' }
];

const SECTION_PRESETS = [
  'CLINICAL PATHOLOGY',
  'BIOCHEMISTRY',
  'LIVER FUNCTION TEST (LFT)',
  'KIDNEY FUNCTION TEST (KFT)',
  'MICROSCOPIC EXAMINATION',
  'URINE ROUTINE'
];

const METHOD_PRESETS = [
  'Manual Microscopy',
  'Dipstick Reaction',
  'Biochemical Method',
  'Enzymatic colorimetric',
  'Immunoturbidimetry'
];

const REFERENCE_PRESETS = [
  {
    label: 'Urine negative / positive',
    inputType: 'select',
    referenceMode: 'positiveNegative',
    sampleType: 'URINE',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    bioReference: serializePositiveNegativeScale(DEFAULT_POSITIVE_NEGATIVE_SCALE)
  },
  {
    label: 'Negative only',
    inputType: 'select',
    referenceMode: 'text',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    bioReference: 'Negative'
  },
  {
    label: 'Reactive / non-reactive',
    inputType: 'select',
    referenceMode: 'text',
    resultOptions: 'Non-reactive\nReactive',
    bioReference: 'Non-reactive'
  },
  {
    label: 'Seen / not seen',
    inputType: 'select',
    referenceMode: 'text',
    resultOptions: 'Not seen\nSeen',
    bioReference: 'Not seen'
  }
];

const EXTRA_REFERENCE_TEMPLATES = [
  {
    label: 'Protein scale',
    inputType: 'select',
    referenceMode: 'custom',
    sampleType: 'URINE',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    bioReference: '- : Negative\n+/- : Positive (15 mg/dL)\n+ : Positive (30 mg/dL)\n++ : Positive (100 mg/dL)\n+++ : Positive (300 mg/dL)'
  },
  {
    label: 'Glucose scale',
    inputType: 'select',
    referenceMode: 'custom',
    sampleType: 'URINE',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    bioReference: '- : Negative\n+/- : Positive (100 mg/dL)\n+ : Positive (250 mg/dL)\n++ : Positive (500 mg/dL)\n+++ : Positive (1000 mg/dL)'
  },
  {
    label: 'Ketone scale',
    inputType: 'select',
    referenceMode: 'custom',
    sampleType: 'URINE',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    bioReference: '- : Negative\n+/- : Positive (5 mg/dL)\n+ : Positive (15 mg/dL)\n++ : Positive (40 mg/dL)\n+++ : Positive (80 mg/dL)'
  },
  {
    label: 'Leucocyte scale',
    inputType: 'select',
    referenceMode: 'custom',
    sampleType: 'URINE',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    bioReference: '- : Negative\n+/- : Positive (15 Leu/uL)\n+ : Positive (70 Leu/uL)\n++ : Positive (125 Leu/uL)\n+++ : Positive (500 Leu/uL)'
  },
  {
    label: 'Absent / present',
    inputType: 'select',
    referenceMode: 'text',
    resultOptions: 'Absent\nPresent',
    bioReference: 'Absent'
  },
  {
    label: 'Clear / turbid',
    inputType: 'select',
    referenceMode: 'text',
    resultOptions: 'Clear\nSlightly turbid\nTurbid',
    bioReference: 'Clear'
  }
];

const ALL_REFERENCE_PRESETS = [...REFERENCE_PRESETS, ...EXTRA_REFERENCE_TEMPLATES];

const REPORT_TEST_TEMPLATES = [
  {
    label: 'Urine colour',
    displayName: 'COLOUR',
    sectionName: 'PHYSICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'text',
    method: '',
    bioReference: 'Pale Yellow',
    resultOptions: '',
    referenceMode: 'text'
  },
  {
    label: 'Urine appearance',
    displayName: 'APPEARENCE',
    sectionName: 'PHYSICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'text',
    method: '',
    bioReference: 'Clear',
    resultOptions: '',
    referenceMode: 'text'
  },
  {
    label: 'Urine reaction',
    displayName: 'REACTION',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'text',
    method: '',
    bioReference: 'Acidic',
    resultOptions: '',
    referenceMode: 'text'
  },
  {
    label: 'Albumin urine',
    displayName: 'ALBUMIN',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Protein Error principle using tetrabromophenol blue',
    bioReference: '- : Negative\n+/- : Positive (15 mg/dL)\n+ : Positive (30 mg/dL)\n++ : Positive (100 mg/dL)\n+++ : Positive (300 mg/dL)',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'custom'
  },
  {
    label: 'Sugar urine',
    displayName: 'SUGAR',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Glucose oxidase - peroxidase method',
    bioReference: '- : Negative\n+/- : Positive (100 mg/dL)\n+ : Positive (250 mg/dL)\n++ : Positive (500 mg/dL)\n+++ : Positive (1000 mg/dL)',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'custom'
  },
  {
    label: 'Specific gravity',
    displayName: 'SPECIFIC GRAVITY',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'number',
    method: 'Based on pKa change of pretreated polyelectrolytes',
    bioReference: '1.000 - 1.030',
    resultOptions: '',
    referenceMode: 'custom'
  },
  {
    label: 'Urine pH',
    displayName: 'URINE PH',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'number',
    method: 'Using pH indicators',
    bioReference: '5.0 - 9.0',
    resultOptions: '',
    referenceMode: 'custom'
  },
  {
    label: 'Urobilinogen',
    displayName: 'UROBILINOGEN',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Ehrlich Reaction',
    bioReference: '- : Negative\n+/- : Positive (1 mg/dL)\n+ : Positive (2 mg/dL)\n++ : Positive (4 mg/dL)\n+++ : Positive (8 mg/dL)\n++++ : Positive (12 mg/dL)',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'custom'
  },
  {
    label: 'Acetone urine',
    displayName: 'ACETONE URINE',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Nitroprusside Reaction',
    bioReference: '- : Negative\n+/- : Positive (5 mg/dL)\n+ : Positive (15 mg/dL)\n++ : Positive (40 mg/dL)\n+++ : Positive (80 mg/dL)',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'custom'
  },
  {
    label: 'Bilirubin urine',
    displayName: 'BILIRUBIN URINE',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Azo coupling reaction with diazonium salt',
    bioReference: '- : Negative\n+ : Positive (1 mg/dL)\n++ : Positive (2 mg/dL)\n+++ : Positive (4 mg/dL)',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'custom'
  },
  {
    label: 'Nitrites',
    displayName: 'NITRITES',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Griess Reaction',
    bioReference: 'Negative / Positive',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'text'
  },
  {
    label: 'Blood urine',
    displayName: 'BLOOD - URINE',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Peroxidase activity of haemoglobin/Manual microscopy',
    bioReference: 'Negative / Positive',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'text'
  },
  {
    label: 'Leucocyte',
    displayName: 'LEUCOCYTE',
    sectionName: 'CHEMICAL EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Detection of Leukocyte Esterase',
    bioReference: '- : Negative\n+/- : Positive (15 Leu/uL)\n+ : Positive (70 Leu/uL)\n++ : Positive (125 Leu/uL)\n+++ : Positive (500 Leu/uL)',
    resultOptions: DEFAULT_DROPDOWN_OPTIONS,
    referenceMode: 'custom'
  },
  {
    label: 'Pus cells',
    displayName: 'PUS CELLS',
    sectionName: 'MICROSCOPIC EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'text',
    method: 'Manual Microscopy',
    bioReference: '- : Negative\n+/- : 15 Leu/uL\n+ : 70 Leu/uL\n++ : 125 Leu/uL\n+++ : 500 Leu/uL',
    resultOptions: '',
    referenceMode: 'custom'
  },
  {
    label: 'RBC cells',
    displayName: 'RBC CELLS',
    sectionName: 'MICROSCOPIC EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'text',
    method: 'Manual Microscopy',
    bioReference: '- : Negative\n+/- : 10 Ery/uL\n+ : 25 Ery/uL\n++ : 80 Ery/uL\n+++ : 200 Ery/uL',
    resultOptions: '',
    referenceMode: 'custom'
  },
  {
    label: 'Epithelial cells',
    displayName: 'EPITHELIAL CELLS',
    sectionName: 'MICROSCOPIC EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'text',
    method: 'Manual Microscopy',
    bioReference: '0-2 /HPF',
    resultOptions: '',
    referenceMode: 'text'
  },
  {
    label: 'Casts / crystals / bacteria',
    displayName: 'CAST CELLS',
    sectionName: 'MICROSCOPIC EXAMINATION, URINE',
    sampleType: 'URINE',
    inputType: 'select',
    method: 'Manual Microscopy',
    bioReference: 'Not Seen /HPF',
    resultOptions: 'Not seen\nSeen',
    referenceMode: 'text'
  }
];

const EMPTY_NEW_TEST = {
  reportTemplateName: '',
  displayName: '',
  sectionName: '',
  description: '',
  unit: '',
  bioReference: '',
  method: '',
  sampleType: 'SERUM',
  price: '',
  inputType: 'number',
  referenceMode: 'custom',
  refLow: '',
  refHigh: '',
  positiveNegativeScale: DEFAULT_POSITIVE_NEGATIVE_SCALE,
  printVisible: true,
  resultOptions: ''
};

const DRAFT_PREFIX = 'healit_profile_draft_';

function draftStorageKey(isNew, profileId) {
  return `${DRAFT_PREFIX}${isNew ? 'new' : profileId}`;
}

/**
 * Reference range structured rows ↔ stored bioReference text.
 *
 * The PDF generator and existing data continue to use a single multi-line
 * `bioReference` string (one rule per line). To give operators a structured UX
 * we parse those lines into [{label, range}] pairs on the fly. Lines that don't
 * match the "label : range" pattern fall through into a "raw" textarea so we
 * never destroy custom formatting.
 */
function parseBioRefRows(text) {
  const raw = String(text || '');
  if (!raw.trim()) return { rows: [], extra: '' };
  const lines = raw.split(/\r?\n/);
  const rows = [];
  const extras = [];
  lines.forEach((line) => {
    if (!line.trim()) return;
    // Match "label : value" or "label: value" (label can have spaces / parens)
    const m = line.match(/^\s*([^:]{1,60}?)\s*:\s*(.+?)\s*$/);
    if (m) {
      rows.push({ label: m[1].trim(), range: m[2].trim() });
    } else {
      extras.push(line);
    }
  });
  return { rows, extra: extras.join('\n') };
}

function serializeBioRefRows(rows, extra) {
  const lines = [];
  rows.forEach((r) => {
    const label = (r.label || '').trim();
    const range = (r.range || '').trim();
    if (!label && !range) return;
    if (label && range) lines.push(`${label}: ${range}`);
    else if (label) lines.push(label);
    else if (range) lines.push(range);
  });
  if (extra && extra.trim()) lines.push(extra.trim());
  return lines.join('\n');
}

function serializePositiveNegativeScale(scale) {
  return (Array.isArray(scale) ? scale : DEFAULT_POSITIVE_NEGATIVE_SCALE)
    .map((row) => {
      const symbol = (row.symbol || '').trim();
      const label = (row.label || '').trim();
      const value = (row.value || '').trim();
      if (!symbol && !label && !value) return '';
      const text = [symbol, label].filter(Boolean).join(' : ');
      return value ? `${text} (${value})` : text;
    })
    .filter(Boolean)
    .join('\n');
}

function getReferenceMode(test, refLow, refHigh) {
  if (test.referenceMode) return test.referenceMode;
  if (Array.isArray(test.positiveNegativeScale)) return 'positiveNegative';
  if ((refLow !== undefined && refLow !== '') || (refHigh !== undefined && refHigh !== '')) return 'numeric';
  return 'custom';
}

function collectCatalogTests() {
  const profiles = getProfiles();
  const map = new Map();
  profiles.forEach((p) => {
    (p.tests || []).forEach((t) => {
      const name = (t.name || t.description || '').trim();
      const unit = (t.unit || '').trim();
      const key = `${name}|${unit}|${(t.bioReference || '').slice(0, 40)}`;
      if (name && !map.has(key)) {
        map.set(key, {
          ...t,
          _sourceProfile: p.name
        });
      }
    });
  });
  return Array.from(map.values());
}

function normalizeTestForEditor(test = {}) {
  const displayName = test.displayName || test.description || test.name || '';
  const refLow = test.refLow ?? test.low ?? test.refLow_snapshot ?? '';
  const refHigh = test.refHigh ?? test.high ?? test.refHigh_snapshot ?? '';
  const inputType = test.inputType || test.inputType_snapshot || test.type || 'number';
  const referenceMode = getReferenceMode(test, refLow, refHigh);
  const positiveNegativeScale = Array.isArray(test.positiveNegativeScale)
    ? test.positiveNegativeScale
    : DEFAULT_POSITIVE_NEGATIVE_SCALE;

  return {
    ...test,
    reportTemplateName: test.reportTemplateName || test.templateName || '',
    displayName,
    name: test.name || displayName,
    description: test.description || displayName,
    sectionName: test.sectionName || test.groupName || '',
    unit: test.unit || '',
    bioReference:
      test.bioReference ||
      test.bioReference_snapshot ||
      test.referenceRange ||
      test.refText_snapshot ||
      (refLow !== '' && refHigh !== '' ? `${refLow} - ${refHigh}` : ''),
    refLow,
    refHigh,
    method: test.method || test.method_snapshot || '',
    sampleType: test.sampleType || test.sampleType_snapshot || 'SERUM',
    inputType,
    referenceMode,
    positiveNegativeScale,
    printVisible: test.printVisible !== false,
    resultOptions: Array.isArray(test.resultOptions || test.options)
      ? (test.resultOptions || test.options).join('\n')
      : (test.resultOptions || test.options || '')
  };
}

function formatPreviewResult(test) {
  if (test.inputType === 'select') {
    const options = String(test.resultOptions || DEFAULT_DROPDOWN_OPTIONS)
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    return options.length ? options.join(' / ') : 'Negative / Positive';
  }
  if (test.inputType === 'text') return 'Text result';
  return test.unit ? `Value\n${test.unit}` : 'Value';
}

function getReferenceText(test) {
  if (test.bioReference) return test.bioReference;
  if (test.refLow && test.refHigh) return `${test.refLow} - ${test.refHigh}`;
  if (test.inputType === 'select' && test.resultOptions) return test.resultOptions;
  return '';
}

function getPrintChecks(test, profileName) {
  const normalized = normalizeTestForEditor(test);
  return {
    name: Boolean((normalized.displayName || normalized.description || normalized.name || '').trim()),
    section: Boolean((normalized.sectionName || profileName || '').trim()),
    sample: Boolean((normalized.sampleType || '').trim()),
    result: normalized.inputType !== 'select' || Boolean(String(normalized.resultOptions || '').trim()),
    method: Boolean(String(normalized.method || '').trim()),
    reference: Boolean(getReferenceText(normalized).trim())
  };
}

const ProfileEditorWorkspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId } = useParams();
  const { role } = useAuthStore();
  const currentUser = getCurrentUser();

  const isNew = location.pathname.endsWith('/new') || !profileId;
  const resolvedProfileId = profileId || null;

  const [step, setStep] = useState(1);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    packagePrice: '',
    tests: []
  });
  const [newTest, setNewTest] = useState(() => ({ ...EMPTY_NEW_TEST }));
  const [collapsed, setCollapsed] = useState({});
  const [pickerQuery, setPickerQuery] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [hasDraft, setHasDraft] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [activeSection, setActiveSection] = useState('details');
  const firstErrorRef = useRef(null);
  const sectionRefs = useRef({});
  const testRefs = useRef({});

  const catalogTests = useMemo(
    () => collectCatalogTests(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refresh when catalog changes externally or tests add/remove
    [catalogVersion, formData.tests.length]
  );

  const filteredPicker = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return catalogTests.slice(0, 12);
    return catalogTests
      .filter((t) => {
        const n = (t.name || t.description || '').toLowerCase();
        return n.includes(q) || (t.unit || '').toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [catalogTests, pickerQuery]);

  const backPath = location.pathname.startsWith('/admin/profile-manager')
    ? '/admin/profile-manager'
    : '/profiles';

  const loadOrInit = useCallback(() => {
    if (isNew) {
      setEditingProfile(null);
      try {
        const raw = localStorage.getItem(draftStorageKey(true, null));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.formData) {
            setFormData({
              ...parsed.formData,
              tests: (parsed.formData.tests || []).map(normalizeTestForEditor)
            });
            if (parsed.newTest) setNewTest({ ...EMPTY_NEW_TEST, ...parsed.newTest });
            else setNewTest({ ...EMPTY_NEW_TEST });
            setHasDraft(true);
            toast.success('Restored unsaved draft', { duration: 2200 });
            return;
          }
        }
      } catch {
        /* ignore corrupt draft */
      }
      setFormData({ name: '', description: '', packagePrice: '', tests: [] });
      setNewTest({ ...EMPTY_NEW_TEST });
      setHasDraft(false);
      return;
    }
    const profiles = getProfiles();
    const p = profiles.find((x) => x.profileId === resolvedProfileId);
    if (!p) {
      toast.error('Profile not found');
      navigate(backPath);
      return;
    }
    setEditingProfile(p);
    let restoredFromDraft = false;
    try {
      const raw = localStorage.getItem(draftStorageKey(false, resolvedProfileId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.formData) {
          setFormData({
            ...parsed.formData,
            tests: (parsed.formData.tests || []).map(normalizeTestForEditor)
          });
          setHasDraft(true);
          restoredFromDraft = true;
          toast.success('Restored unsaved edit draft', { duration: 2200 });
        }
      }
    } catch {
      /* ignore */
    }
    if (!restoredFromDraft) {
      setFormData({
        name: p.name,
        description: p.description || '',
        packagePrice: p.packagePrice || '',
        tests: (p.tests || []).map(normalizeTestForEditor)
      });
      setHasDraft(false);
    }
    setNewTest({ ...EMPTY_NEW_TEST });
  }, [isNew, resolvedProfileId, navigate, backPath]);

  useEffect(() => {
    loadOrInit();
  }, [loadOrInit]);

  /* Auto-save draft */
  useEffect(() => {
    const key = draftStorageKey(isNew, resolvedProfileId);
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            formData,
            newTest,
            profileId: resolvedProfileId,
            savedAt: Date.now()
          })
        );
        setDraftSavedAt(Date.now());
        setHasDraft(true);
      } catch {
        /* quota */
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [formData, newTest, isNew, resolvedProfileId]);

  /* Refresh catalog when tab regains focus (other tabs may have edited profiles) */
  useEffect(() => {
    const onFocus = () => setCatalogVersion((v) => v + 1);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const calculateTotalPrice = () =>
    formData.tests.reduce((sum, test) => sum + (parseFloat(test.price) || 0), 0);

  const packageNum = parseFloat(formData.packagePrice) || 0;
  const individualTotal = calculateTotalPrice();
  const savings = individualTotal - packageNum;

  const updateTestInProfile = (testId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => {
        if (t.testId !== testId) return t;
        const updated = { ...t, [field]: value };
        if (field === 'description') {
          updated.name = value;
          if (!updated.displayName) updated.displayName = value;
        }
        if (field === 'displayName') updated.description = value;
        return updated;
      })
    }));
  };

  const removeTestFromProfile = (testId) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.filter((t) => t.testId !== testId)
    }));
  };

  const moveTest = (testId, direction) => {
    setFormData((prev) => {
      const index = prev.tests.findIndex((t) => t.testId === testId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.tests.length) return prev;
      const tests = [...prev.tests];
      [tests[index], tests[nextIndex]] = [tests[nextIndex], tests[index]];
      return { ...prev, tests };
    });
  };

  const handleAddTest = () => {
    const e = {};
    if (!newTest.description?.trim()) e.newTest_desc = 'Description is required';
    if (newTest.price === '' || newTest.price === undefined || Number.isNaN(parseFloat(newTest.price))) {
      e.newTest_price = 'Valid price is required';
    }
    if (Object.keys(e).length) {
      setFormErrors((er) => ({ ...er, ...e }));
      return;
    }
    const test = {
      ...normalizeTestForEditor(newTest),
      testId: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      price: parseFloat(newTest.price) || 0,
      name: newTest.description,
      resultOptions: newTest.inputType === 'select' && !newTest.resultOptions.trim()
        ? DEFAULT_DROPDOWN_OPTIONS
        : newTest.resultOptions
    };
    setFormData((prev) => ({ ...prev, tests: [...prev.tests, test] }));
    setNewTest({ ...EMPTY_NEW_TEST });
    setFormErrors((er) => {
      const c = { ...er };
      delete c.newTest_desc;
      delete c.newTest_price;
      delete c.tests;
      return c;
    });
  };

  const cloneCatalogTestIntoProfile = (t) => {
    const test = {
      testId: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      displayName: t.displayName || t.name || t.description,
      sectionName: t.sectionName || '',
      reportTemplateName: t.reportTemplateName || t.templateName || '',
      name: t.name || t.description,
      description: t.name || t.description,
      unit: t.unit || '',
      bioReference: t.bioReference || '',
      refLow: t.refLow || '',
      refHigh: t.refHigh || '',
      method: t.method || '',
      sampleType: t.sampleType || 'SERUM',
      price: parseFloat(t.price) || 0,
      inputType: t.inputType || t.inputType_snapshot || 'number',
      referenceMode: t.referenceMode || 'custom',
      positiveNegativeScale: Array.isArray(t.positiveNegativeScale)
        ? t.positiveNegativeScale
        : DEFAULT_POSITIVE_NEGATIVE_SCALE,
      printVisible: t.printVisible !== false,
      resultOptions: t.resultOptions || (t.inputType === 'select' ? DEFAULT_DROPDOWN_OPTIONS : '')
    };
    setFormData((prev) => ({ ...prev, tests: [...prev.tests, test] }));
    toast.success(`Added "${test.name}" from catalog`);
  };

  /* Structured range rows ↔ bioReference */
  const setBioRefFromRows = (testId, rows, extra) => {
    const next = serializeBioRefRows(rows, extra);
    updateTestInProfile(testId, 'bioReference', next);
  };

  const updateRangeRow = (testId, idx, field, value) => {
    const test = formData.tests.find((x) => x.testId === testId);
    if (!test) return;
    const { rows, extra } = parseBioRefRows(test.bioReference);
    const next = rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    setBioRefFromRows(testId, next, extra);
  };

  const addRangeRow = (testId) => {
    const test = formData.tests.find((x) => x.testId === testId);
    if (!test) return;
    const { rows, extra } = parseBioRefRows(test.bioReference);
    const next = [...rows, { label: '', range: '' }];
    setBioRefFromRows(testId, next, extra);
  };

  const removeRangeRow = (testId, idx) => {
    const test = formData.tests.find((x) => x.testId === testId);
    if (!test) return;
    const { rows, extra } = parseBioRefRows(test.bioReference);
    const next = rows.filter((_, i) => i !== idx);
    setBioRefFromRows(testId, next, extra);
  };

  const updateNumericReference = (testId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => {
        if (t.testId !== testId) return t;
        const updated = { ...t, referenceMode: 'numeric', [field]: value };
        const low = field === 'refLow' ? value : updated.refLow;
        const high = field === 'refHigh' ? value : updated.refHigh;
        updated.bioReference = low && high ? `${low} - ${high}` : (low ? `> ${low}` : (high ? `< ${high}` : ''));
        return updated;
      })
    }));
  };

  const setReferenceMode = (testId, mode) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => {
        if (t.testId !== testId) return t;
        const updated = normalizeTestForEditor({ ...t, referenceMode: mode });
        if (mode === 'positiveNegative') {
          updated.inputType = 'select';
          updated.resultOptions = updated.resultOptions || DEFAULT_DROPDOWN_OPTIONS;
          updated.bioReference = serializePositiveNegativeScale(updated.positiveNegativeScale);
        }
        if (mode === 'numeric' && updated.refLow && updated.refHigh) {
          updated.bioReference = `${updated.refLow} - ${updated.refHigh}`;
        }
        return updated;
      })
    }));
  };

  const updatePositiveNegativeScale = (testId, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => {
        if (t.testId !== testId) return t;
        const normalized = normalizeTestForEditor(t);
        const scale = normalized.positiveNegativeScale.map((row, rowIndex) =>
          rowIndex === index ? { ...row, [field]: value } : row
        );
        return {
          ...normalized,
          referenceMode: 'positiveNegative',
          inputType: 'select',
          resultOptions: normalized.resultOptions || DEFAULT_DROPDOWN_OPTIONS,
          positiveNegativeScale: scale,
          bioReference: serializePositiveNegativeScale(scale)
        };
      })
    }));
  };

  const applyPositiveNegativeReference = (testId) => {
    setReferenceMode(testId, 'positiveNegative');
  };

  const applyReferencePreset = (testId, preset) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => {
        if (t.testId !== testId) return t;
        return normalizeTestForEditor({
          ...t,
          inputType: preset.inputType,
          reportTemplateName: preset.label,
          referenceMode: preset.referenceMode,
          sampleType: preset.sampleType || t.sampleType || 'SERUM',
          resultOptions: preset.resultOptions,
          positiveNegativeScale:
            preset.referenceMode === 'positiveNegative'
              ? DEFAULT_POSITIVE_NEGATIVE_SCALE
              : (t.positiveNegativeScale || DEFAULT_POSITIVE_NEGATIVE_SCALE),
          bioReference: preset.bioReference
        });
      })
    }));
  };

  const applyReportTemplate = (testId, template) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => {
        if (t.testId !== testId) return t;
        return normalizeTestForEditor({
          ...t,
          ...template,
          reportTemplateName: template.label,
          name: template.displayName,
          description: template.displayName,
          price: t.price
        });
      })
    }));
  };

  const applyNewTestTemplate = (template) => {
    setNewTest((prev) => ({
      ...prev,
      ...template,
      reportTemplateName: template.label,
      name: template.displayName,
      description: template.displayName,
      price: prev.price
    }));
  };

  const autoFillMissingPrintDetails = () => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.map((test) => {
        const normalized = normalizeTestForEditor(test);
        const sectionName = normalized.sectionName || prev.name || 'TEST RESULTS';
        const inputType = normalized.inputType || 'number';
        const resultOptions = inputType === 'select' && !String(normalized.resultOptions || '').trim()
          ? DEFAULT_DROPDOWN_OPTIONS
          : normalized.resultOptions;
        const method = normalized.method || (
          /urine|microscopic|clinical pathology/i.test(sectionName)
            ? 'Manual Microscopy'
            : 'Biochemical Method'
        );
        const bioReference = getReferenceText({ ...normalized, resultOptions }) ||
          (inputType === 'select' ? 'Negative / Positive' : '-');
        return {
          ...normalized,
          sectionName,
          inputType,
          resultOptions,
          method,
          bioReference,
          sampleType: normalized.sampleType || (/urine/i.test(sectionName) ? 'URINE' : 'SERUM')
        };
      })
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith('warn-')) delete next[key];
      });
      return next;
    });
    toast.success('Missing print details filled');
  };

  const scrollToSection = (id) => {
    const nextStep = stepKeys.indexOf(id) + 1;
    if (nextStep > 0) setStep(nextStep);
    const node = sectionRefs.current[id];
    setActiveSection(id);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTest = (testId) => {
    setStep(2);
    setActiveSection('tests');
    setCollapsed((s) => ({ ...s, [testId]: false }));
    requestAnimationFrame(() => {
      const node = testRefs.current[testId];
      if (!node) return;
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = node.querySelector('input, textarea, select');
      if (input?.focus) input.focus();
    });
  };

  const toggleCollapsed = (testId) => {
    setCollapsed((s) => ({ ...s, [testId]: !s[testId] }));
  };

  const validateAll = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Profile name is required';
    if (formData.tests.length === 0) e.tests = 'Add at least one test';
    const names = formData.tests.map((t) => (t.displayName || t.description || t.name || '').trim().toLowerCase());
    const seen = new Set();
    names.forEach((n) => {
      if (!n) return;
      if (seen.has(n)) e.tests_dup = 'Duplicate test names are not allowed';
      seen.add(n);
    });
    formData.tests.forEach((t, i) => {
      if (!String(t.displayName || t.description || t.name || '').trim()) {
        e[`test_${t.testId}_desc`] = `Test #${i + 1}: description required`;
      }
      if (t.price === '' || t.price === undefined || Number.isNaN(parseFloat(t.price))) {
        e[`test_${t.testId}_price`] = `Test #${i + 1}: valid price required`;
      }
    });
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1 && !formData.name.trim()) e.name = 'Profile name is required';
    if (s === 2 && formData.tests.length === 0) e.tests = 'Add at least one test';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const focusFirstError = () => {
    requestAnimationFrame(() => {
      const node = firstErrorRef.current?.querySelector(
        '.pew-field--error input, .pew-field--error select, .pew-field--error textarea'
      );
      if (node && typeof node.focus === 'function') node.focus();
    });
  };

  const persistProfile = () => {
    if (!validateAll()) {
      setFormErrors((er) => ({ ...er, _summary: 'Fix the highlighted fields below' }));
      focusFirstError();
      return;
    }
    try {
      const profileData = {
        name: formData.name,
        description: formData.description,
        packagePrice: parseFloat(formData.packagePrice) || 0,
        testIds: formData.tests.map((t) => t.testId),
        tests: formData.tests.map(normalizeTestForEditor),
        createdBy: currentUser?.userId || 'unknown',
        createdByName: currentUser?.fullName || 'Unknown User',
        createdByRole: role
      };

      if (editingProfile) {
        const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
        const index = allProfiles.findIndex((p) => p.profileId === editingProfile.profileId);
        if (index !== -1) {
          allProfiles[index] = {
            ...allProfiles[index],
            ...profileData,
            updatedBy: currentUser?.userId || 'unknown',
            updatedByName: currentUser?.fullName || 'Unknown User',
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('healit_profiles', JSON.stringify(allProfiles));
          toast.success('Profile updated');
        }
      } else {
        addProfile(profileData);
        toast.success('Profile created');
      }
      localStorage.removeItem(draftStorageKey(isNew, resolvedProfileId));
      setHasDraft(false);
      navigate(backPath);
    } catch (err) {
      toast.error('Failed to save');
      console.error(err);
    }
  };

  const saveDraftManual = () => {
    try {
      const key = draftStorageKey(isNew, resolvedProfileId);
      localStorage.setItem(
        key,
        JSON.stringify({ formData, newTest, profileId: resolvedProfileId, savedAt: Date.now() })
      );
      setDraftSavedAt(Date.now());
      setHasDraft(true);
      toast.success('Draft saved');
    } catch {
      toast.error('Could not save draft');
    }
  };

  const discardDraft = () => {
    if (!confirm('Discard the saved draft and reload the original?')) return;
    localStorage.removeItem(draftStorageKey(isNew, resolvedProfileId));
    setHasDraft(false);
    setDraftSavedAt(null);
    loadOrInit();
  };

  const goBack = () => {
    navigate(backPath);
  };

  const stepTitles = ['Profile details', 'Tests', 'Pricing', 'Preview & validation'];
  const stepKeys = ['details', 'tests', 'pricing', 'review'];

  const showSection = (sectionIndex) => {
    return step === sectionIndex;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setStep((s) => {
      const next = Math.min(4, s + 1);
      setActiveSection(stepKeys[next - 1]);
      return next;
    });
  };

  const prevStep = () => {
    setStep((s) => {
      const next = Math.max(1, s - 1);
      setActiveSection(stepKeys[next - 1]);
      return next;
    });
  };

  const draftLabel =
    draftSavedAt == null
      ? ''
      : `Draft saved ${Math.max(0, Math.round((Date.now() - draftSavedAt) / 1000))}s ago`;

  /* Validation issue list (derived from formErrors – live updates as user fixes things) */
  const issueList = useMemo(() => {
    const items = [];
    if (formErrors.name) {
      items.push({ id: 'err-name', target: 'details', label: formErrors.name });
    }
    if (formErrors.tests) {
      items.push({ id: 'err-tests', target: 'tests', label: formErrors.tests });
    }
    if (formErrors.tests_dup) {
      items.push({ id: 'err-tests-dup', target: 'tests', label: formErrors.tests_dup });
    }
    formData.tests.forEach((t, i) => {
      const checks = getPrintChecks(t, formData.name);
      if (formErrors[`test_${t.testId}_desc`]) {
        items.push({
          id: `err-${t.testId}-desc`,
          target: 'tests',
          testId: t.testId,
          label: `Test #${i + 1}: description required`
        });
      }
      if (formErrors[`test_${t.testId}_price`]) {
        items.push({
          id: `err-${t.testId}-price`,
          target: 'tests',
          testId: t.testId,
          label: `Test #${i + 1}: valid price required`
        });
      }
      if (t.printVisible !== false) {
        if (!checks.section) {
          items.push({
            id: `warn-${t.testId}-section`,
            target: 'tests',
            testId: t.testId,
            label: `Test #${i + 1}: add report section`
          });
        }
        if (!checks.method) {
          items.push({
            id: `warn-${t.testId}-method`,
            target: 'tests',
            testId: t.testId,
            label: `Test #${i + 1}: add method for print`
          });
        }
        if (!checks.reference) {
          items.push({
            id: `warn-${t.testId}-reference`,
            target: 'tests',
            testId: t.testId,
            label: `Test #${i + 1}: add biological reference`
          });
        }
        if (!checks.result) {
          items.push({
            id: `warn-${t.testId}-result`,
            target: 'tests',
            testId: t.testId,
            label: `Test #${i + 1}: add dropdown result values`
          });
        }
      }
    });
    return items;
  }, [formErrors, formData.name, formData.tests]);

  const testHasError = (testId) =>
    Boolean(
      formErrors[`test_${testId}_desc`] ||
      formErrors[`test_${testId}_price`] ||
      issueList.some((item) => item.testId === testId)
    );

  const previewTests = useMemo(
    () => formData.tests.map(normalizeTestForEditor).filter((test) => test.printVisible !== false),
    [formData.tests]
  );

  const previewGroups = useMemo(() => {
    const groups = new Map();
    previewTests.forEach((test) => {
      const groupName = test.sectionName || formData.name || 'TEST RESULTS';
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(test);
    });
    return Array.from(groups, ([name, tests]) => ({ name, tests }));
  }, [previewTests, formData.name]);

  const hiddenPrintCount = formData.tests.length - previewTests.length;

  return (
    <div className="pew">
      <header className="pew-topbar">
        <div className="pew-topbar-left">
          <button type="button" className="pew-back" onClick={goBack}>
            <ArrowLeft size={18} />
            Back to profiles
          </button>
          <div className="pew-title-block">
            <h1>{isNew ? 'New profile package' : 'Edit profile package'}</h1>
            <p>
              {isNew
                ? 'Single-page workspace — scroll the page to review all tests. Actions stay at the bottom.'
                : editingProfile?.name || 'Loading…'}
            </p>
          </div>
        </div>
        <div className="pew-topbar-right" aria-live="polite">
          {draftSavedAt != null && (
            <div className="pew-draft" title="Drafts are stored in this browser only">
              <strong>Auto-save</strong> · {draftLabel}
            </div>
          )}
          {hasDraft && !isNew && (
            <button
              type="button"
              className="pew-back pew-back--danger"
              onClick={discardDraft}
              title="Drop the unsaved draft and reload the saved profile"
            >
              <X size={16} />
              Discard draft
            </button>
          )}
        </div>
      </header>

      <section className="pew-hero" aria-label="Package metrics">
        <div className="pew-hero-item pew-hero-item--primary">
          <span className="pew-hero-label">Profile</span>
          <strong className="pew-hero-value">{formData.name || '(unnamed)'}</strong>
        </div>
        <div className="pew-hero-item">
          <span className="pew-hero-label">Tests</span>
          <strong className="pew-hero-value">{formData.tests.length}</strong>
        </div>
        <div className="pew-hero-item">
          <span className="pew-hero-label">Line total</span>
          <strong className="pew-hero-value">₹{individualTotal.toFixed(2)}</strong>
        </div>
        <div className="pew-hero-item">
          <span className="pew-hero-label">Package price</span>
          <strong className="pew-hero-value">₹{packageNum.toFixed(2)}</strong>
        </div>
        {packageNum > 0 && individualTotal > packageNum && (
          <div className="pew-hero-item pew-hero-item--good">
            <span className="pew-hero-label">Savings</span>
            <strong className="pew-hero-value">₹{savings.toFixed(2)}</strong>
          </div>
        )}
        {packageNum > individualTotal && (
          <div className="pew-hero-item pew-hero-item--warn">
            <span className="pew-hero-label">Above sum</span>
            <strong className="pew-hero-value">₹{(packageNum - individualTotal).toFixed(2)}</strong>
          </div>
        )}
      </section>

      <nav className="pew-steps" aria-label="Profile editor steps">
          {stepTitles.map((title, idx) => {
            const n = idx + 1;
            return (
              <button
                key={title}
                type="button"
                className={`pew-step ${step === n ? 'pew-step--active' : ''}`}
                onClick={() => {
                  setStep(n);
                  setActiveSection(stepKeys[idx]);
                }}
              >
                <span className="pew-step-num">{n}</span>
                {title}
              </button>
            );
          })}
      </nav>

      <div className="pew-grid" ref={firstErrorRef}>
        <aside className="pew-rail" aria-label="Editor sections">
          <div className="pew-rail-section">
            <p className="pew-rail-title">Sections</p>
            <button
              type="button"
              className={`pew-rail-link ${activeSection === 'details' ? 'pew-rail-link--active' : ''}`}
              onClick={() => scrollToSection('details')}
            >
              <FileText size={14} /> Profile details
            </button>
            <button
              type="button"
              className={`pew-rail-link ${activeSection === 'tests' ? 'pew-rail-link--active' : ''}`}
              onClick={() => scrollToSection('tests')}
            >
              <ListChecks size={14} /> Tests
              <span className="pew-rail-count">{formData.tests.length}</span>
            </button>
            <button
              type="button"
              className={`pew-rail-link ${activeSection === 'pricing' ? 'pew-rail-link--active' : ''}`}
              onClick={() => scrollToSection('pricing')}
            >
              <Tag size={14} /> Pricing
            </button>
            <button
              type="button"
              className={`pew-rail-link ${activeSection === 'review' ? 'pew-rail-link--active' : ''}`}
              onClick={() => scrollToSection('review')}
            >
              <CheckCircle2 size={14} /> Preview & validation
            </button>
          </div>

          <div className="pew-rail-section">
            <p className="pew-rail-title">Tests in package</p>
            {formData.tests.length === 0 ? (
              <div className="pew-rail-empty">No tests yet — add from catalog or below.</div>
            ) : (
              <ul className="pew-rail-tests">
                {formData.tests.map((t, i) => (
                  <li key={t.testId}>
                    <button
                      type="button"
                      className={`pew-rail-test ${testHasError(t.testId) ? 'pew-rail-test--error' : ''}`}
                      onClick={() => scrollToTest(t.testId)}
                      title={t.description || t.name || `Test #${i + 1}`}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i + 1}. {t.description || t.name || '(unnamed)'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pew-rail-section">
            <p className="pew-rail-title">Validation</p>
            {issueList.length === 0 ? (
              <div className="pew-rail-validation">
                <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                No issues
              </div>
            ) : (
              <div className="pew-rail-validation pew-rail-validation--issues">
                <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {issueList.length} issue{issueList.length !== 1 ? 's' : ''} to fix
                <ul className="pew-rail-validation-list">
                  {issueList.slice(0, 6).map((it) => (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() =>
                          it.testId ? scrollToTest(it.testId) : scrollToSection(it.target)
                        }
                      >
                        • {it.label}
                      </button>
                    </li>
                  ))}
                  {issueList.length > 6 && <li>+ {issueList.length - 6} more</li>}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <div className="pew-main-col">
          {formErrors._summary && (
            <div role="alert" className="pew-summary-error">
              {formErrors._summary}
            </div>
          )}
          {showSection(1) && (
            <section
              className="pew-section"
              aria-labelledby="pew-sec-details"
              ref={(el) => (sectionRefs.current.details = el)}
            >
              <div className="pew-section-head">
                <h2 id="pew-sec-details">Profile information</h2>
              </div>
              <div className="pew-fields">
                <div className={`pew-field pew-field--span-12 ${formErrors.name ? 'pew-field--error' : ''}`}>
                  <label htmlFor="pew-name">Package name *</label>
                  <span className="pew-helper">Shown on invoices and reports (e.g. Kidney Function Test).</span>
                  <input
                    id="pew-name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors((er) => ({ ...er, name: undefined }));
                    }}
                    placeholder="e.g. Complete Blood Count (CBC)"
                  />
                  {formErrors.name && <div className="pew-field-error">{formErrors.name}</div>}
                </div>
                <div className="pew-field pew-field--span-12">
                  <label htmlFor="pew-desc">Description</label>
                  <span className="pew-helper">Optional short summary for staff.</span>
                  <textarea
                    id="pew-desc"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                    style={{ fontFamily: 'inherit', minHeight: 56 }}
                  />
                </div>
              </div>
            </section>
          )}

          {showSection(2) && (
            <section
              className="pew-section"
              aria-labelledby="pew-sec-tests"
              ref={(el) => (sectionRefs.current.tests = el)}
            >
              <div className="pew-section-head">
                <h2 id="pew-sec-tests">Included tests</h2>
                <div className="pew-section-actions">
                  <button type="button" onClick={autoFillMissingPrintDetails}>
                    Auto-fill print details
                  </button>
                  <span>{formData.tests.length} test{formData.tests.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {formErrors.tests && <div className="pew-field-error" style={{ marginBottom: 12 }}>{formErrors.tests}</div>}
              {formErrors.tests_dup && (
                <div className="pew-field-error" style={{ marginBottom: 12 }}>{formErrors.tests_dup}</div>
              )}

              <div className="pew-picker">
                <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: 8 }}>
                  Add from catalog
                </strong>
                <span className="pew-helper" style={{ display: 'block', marginBottom: 8 }}>
                  Search tests already defined on other profiles and clone into this package.
                </span>
                <div className="pew-picker-search">
                  <Search size={18} />
                  <input
                    type="search"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Search by test name or unit…"
                    aria-label="Search catalog tests"
                  />
                </div>
                <div className="pew-picker-results">
                  {filteredPicker.length === 0 ? (
                    <div className="pew-picker-row" style={{ cursor: 'default', color: '#94a3b8' }}>
                      No matches
                    </div>
                  ) : (
                    filteredPicker.map((t) => (
                      <div
                        key={`${t.name}_${t.unit}_${t._sourceProfile}`}
                        className="pew-picker-row"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && cloneCatalogTestIntoProfile(t)}
                        onClick={() => cloneCatalogTestIntoProfile(t)}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.name || t.description}</div>
                          <div className="pew-picker-meta">
                            {t.unit || '—'} · from {t._sourceProfile}
                          </div>
                        </div>
                        <Plus size={18} color="#0d9488" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pew-test-table" role="table" aria-label="Tests in package">
                <div className="pew-test-table-head" role="row">
                  <span aria-hidden="true" />
                  <span>Test name</span>
                  <span>Unit</span>
                  <span>Price</span>
                  <span>Sample</span>
                  <span>Result</span>
                  <span>Reference</span>
                  <span>Print</span>
                  <span>Actions</span>
                </div>
                {formData.tests.map((test, idx) => {
                  const normalized = normalizeTestForEditor(test);
                  const isCollapsed = collapsed[test.testId] !== false;
                  const resultTypeLabel =
                    RESULT_TYPE_OPTIONS.find((option) => option.value === normalized.inputType)?.label || 'Number';
                  const printChecks = getPrintChecks(normalized, formData.name);

                  return (
                    <div
                      key={test.testId}
                      className={`pew-test-card ${isCollapsed ? 'pew-test-card--collapsed' : ''} ${
                        testHasError(test.testId) ? 'pew-test-card--error' : ''
                      }`}
                      ref={(el) => (testRefs.current[test.testId] = el)}
                    >
                      <div className="pew-test-row" role="row">
                        <button
                          type="button"
                          className="pew-test-toggle"
                          aria-expanded={!isCollapsed}
                          onClick={() => toggleCollapsed(test.testId)}
                          title={isCollapsed ? 'Expand test details' : 'Collapse test details'}
                        >
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          type="button"
                          className="pew-test-name-btn"
                          onClick={() => toggleCollapsed(test.testId)}
                        >
                          <strong>{idx + 1}. {normalized.displayName || normalized.description || normalized.name || '(unnamed)'}</strong>
                          <span>{normalized.sectionName || formData.name || 'TEST RESULTS'}</span>
                        </button>
                        <span className="pew-test-cell">{normalized.unit || '-'}</span>
                        <span className="pew-test-cell">Rs. {(parseFloat(normalized.price) || 0).toFixed(2)}</span>
                        <span className="pew-test-cell">{normalized.sampleType || 'SERUM'}</span>
                        <span className="pew-test-cell">{resultTypeLabel}</span>
                        <span className="pew-test-cell pew-ref-summary">
                          {normalized.bioReference || normalized.referenceMode || '-'}
                        </span>
                        <button
                          type="button"
                          className={`pew-print-toggle ${normalized.printVisible ? 'pew-print-toggle--on' : ''}`}
                          onClick={() => updateTestInProfile(test.testId, 'printVisible', !normalized.printVisible)}
                          title={normalized.printVisible ? 'Shown in report print' : 'Hidden from report print'}
                        >
                          {normalized.printVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                          {normalized.printVisible ? 'Show' : 'Hide'}
                        </button>
                        <div className="pew-test-actions">
                          <button
                            type="button"
                            onClick={() => moveTest(test.testId, -1)}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTest(test.testId, 1)}
                            disabled={idx === formData.tests.length - 1}
                            title="Move down"
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button
                            type="button"
                            className="pew-test-remove"
                            title="Remove test"
                            onClick={() => removeTestFromProfile(test.testId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="pew-test-card-body">
                        <div className="pew-report-guide" aria-label="Report setup checklist">
                          <span className={printChecks.name ? 'pew-guide-ok' : 'pew-guide-missing'}>1. Name</span>
                          <span className={printChecks.section ? 'pew-guide-ok' : 'pew-guide-missing'}>2. Section</span>
                          <span className={printChecks.sample && printChecks.result ? 'pew-guide-ok' : 'pew-guide-missing'}>3. Result setup</span>
                          <span className={printChecks.method ? 'pew-guide-ok' : 'pew-guide-missing'}>4. Method</span>
                          <span className={printChecks.reference ? 'pew-guide-ok' : 'pew-guide-missing'}>5. Reference</span>
                        </div>
                    <div className="pew-fields">
                      <div className="pew-field pew-field--span-12">
                        <label>Report content template</label>
                        <span className="pew-helper">Use this to fill Hygea-style wording, method, sample type and reference scale.</span>
                        <select
                          value={normalized.reportTemplateName || ''}
                          onChange={(e) => {
                            const template = REPORT_TEST_TEMPLATES.find((item) => item.label === e.target.value);
                            if (template) applyReportTemplate(test.testId, template);
                          }}
                        >
                          <option value="">Choose a urine / microscopy template...</option>
                          {REPORT_TEST_TEMPLATES.map((template) => (
                            <option key={template.label} value={template.label}>
                              {template.label}
                            </option>
                          ))}
                        </select>
                        <div className="pew-template-grid">
                          {REPORT_TEST_TEMPLATES.slice(0, 10).map((template) => (
                            <button
                              key={template.label}
                              type="button"
                              onClick={() => applyReportTemplate(test.testId, template)}
                            >
                              {template.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={`pew-field pew-field--span-6 ${formErrors[`test_${test.testId}_desc`] ? 'pew-field--error' : ''}`}>
                        <label>Test display name *</label>
                        <span className="pew-helper">Printed in the report, e.g. Creatinine - Serum.</span>
                        <input
                          value={normalized.displayName || normalized.description || normalized.name || ''}
                          onChange={(e) => {
                            updateTestInProfile(test.testId, 'displayName', e.target.value);
                            setFormErrors((er) => {
                              const c = { ...er };
                              delete c[`test_${test.testId}_desc`];
                              return c;
                            });
                          }}
                          placeholder="Test name"
                        />
                        {formErrors[`test_${test.testId}_desc`] && (
                          <div className="pew-field-error">{formErrors[`test_${test.testId}_desc`]}</div>
                        )}
                      </div>
                      <div className="pew-field pew-field--span-3">
                        <label>Group / section</label>
                        <span className="pew-helper">Used as centered heading in print.</span>
                        <input
                          value={normalized.sectionName || ''}
                          onChange={(e) => updateTestInProfile(test.testId, 'sectionName', e.target.value)}
                          placeholder={formData.name || 'CLINICAL PATHOLOGY'}
                        />
                        <div className="pew-chip-row">
                          {SECTION_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => updateTestInProfile(test.testId, 'sectionName', preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="pew-field pew-field--span-3">
                        <label>Template name</label>
                        <span className="pew-helper">For staff search/reuse.</span>
                        <input
                          value={normalized.reportTemplateName || ''}
                          onChange={(e) => updateTestInProfile(test.testId, 'reportTemplateName', e.target.value)}
                          placeholder="e.g. Albumin urine"
                        />
                      </div>
                      <div className="pew-field pew-field--span-3">
                        <label>Units</label>
                        <span className="pew-helper">mg/dL, mmol/L, %, HPF…</span>
                        <input
                          value={test.unit || ''}
                          onChange={(e) => updateTestInProfile(test.testId, 'unit', e.target.value)}
                          placeholder="mg/dL"
                        />
                      </div>
                      <div className={`pew-field pew-field--span-3 ${formErrors[`test_${test.testId}_price`] ? 'pew-field--error' : ''}`}>
                        <label>Price (₹) *</label>
                        <input
                          type="number"
                          value={test.price ?? ''}
                          onChange={(e) => {
                            updateTestInProfile(test.testId, 'price', parseFloat(e.target.value) || 0);
                            setFormErrors((er) => {
                              const c = { ...er };
                              delete c[`test_${test.testId}_price`];
                              return c;
                            });
                          }}
                          min={0}
                          step={0.01}
                        />
                        {formErrors[`test_${test.testId}_price`] && (
                          <div className="pew-field-error">{formErrors[`test_${test.testId}_price`]}</div>
                        )}
                      </div>
                      <div className="pew-field pew-field--span-6">
                        <label>Sample type</label>
                        <select
                          value={test.sampleType || 'SERUM'}
                          onChange={(e) => updateTestInProfile(test.testId, 'sampleType', e.target.value)}
                        >
                          {SAMPLE_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="pew-field pew-field--span-3">
                        <label>Result type</label>
                        <select
                          value={normalized.inputType}
                          onChange={(e) => updateTestInProfile(test.testId, 'inputType', e.target.value)}
                        >
                          {RESULT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="pew-field pew-field--span-3">
                        <label>Print visibility</label>
                        <label className="pew-switch-row">
                          <input
                            type="checkbox"
                            checked={normalized.printVisible}
                            onChange={(e) => updateTestInProfile(test.testId, 'printVisible', e.target.checked)}
                          />
                          Show in PDF report
                        </label>
                      </div>
                      <div className="pew-field pew-field--span-6">
                        <label>Method</label>
                        <span className="pew-helper">One short line is enough (e.g. Manual Microscopy). Grading scales go in reference range.</span>
                        <textarea
                          className="pew-textarea--method"
                          rows={2}
                          value={test.method || ''}
                          onChange={(e) => updateTestInProfile(test.testId, 'method', e.target.value)}
                          placeholder="e.g. Manual Microscopy"
                        />
                        <div className="pew-chip-row">
                          {METHOD_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => updateTestInProfile(test.testId, 'method', preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                        {test.method && /\n/.test(test.method) && (
                          <div className="pew-warn-banner" style={{ margin: '8px 0 0' }}>
                            <strong>Tip:</strong> Multi-line text usually belongs in <strong>Reference range</strong> below, not Method.
                          </div>
                        )}
                      </div>
                      {normalized.inputType === 'select' && (
                        <div className="pew-field pew-field--span-6">
                          <label>Dropdown values</label>
                          <span className="pew-helper">One option per line, e.g. Negative / Trace / Positive.</span>
                          <textarea
                            rows={4}
                            value={normalized.resultOptions}
                            onChange={(e) => updateTestInProfile(test.testId, 'resultOptions', e.target.value)}
                            placeholder={'Negative\nTrace\nPositive'}
                          />
                        </div>
                      )}
                      <div className="pew-field pew-field--span-12">
                        <label>Biological reference range</label>
                        <span className="pew-helper">
                          Choose the print format staff need: numeric limits, text reference,
                          positive/negative grading, or custom multiline notes.
                        </span>
                        <div className="pew-reference-mode">
                          {REFERENCE_MODE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={normalized.referenceMode === option.value ? 'pew-reference-mode--active' : ''}
                              onClick={() => setReferenceMode(test.testId, option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="pew-ref-presets">
                          {ALL_REFERENCE_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => applyReferencePreset(test.testId, preset)}
                            >
                              {preset.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => applyPositiveNegativeReference(test.testId)}
                          >
                            Use negative / positive grading
                          </button>
                        </div>
                        {normalized.referenceMode === 'numeric' && (
                          <div className="pew-numeric-ref">
                            <input
                              value={normalized.refLow || ''}
                              onChange={(e) => updateNumericReference(test.testId, 'refLow', e.target.value)}
                              placeholder="Low, e.g. 0.72"
                            />
                            <input
                              value={normalized.refHigh || ''}
                              onChange={(e) => updateNumericReference(test.testId, 'refHigh', e.target.value)}
                              placeholder="High, e.g. 1.18"
                            />
                            <span>{normalized.unit || 'unit optional'}</span>
                          </div>
                        )}
                        {normalized.referenceMode === 'positiveNegative' && (
                          <div className="pew-scale-editor">
                            {normalized.positiveNegativeScale.map((row, scaleIndex) => (
                              <div className="pew-scale-row" key={`${test.testId}-scale-${scaleIndex}`}>
                                <input
                                  value={row.symbol || ''}
                                  onChange={(e) =>
                                    updatePositiveNegativeScale(test.testId, scaleIndex, 'symbol', e.target.value)
                                  }
                                  placeholder="Symbol"
                                />
                                <input
                                  value={row.label || ''}
                                  onChange={(e) =>
                                    updatePositiveNegativeScale(test.testId, scaleIndex, 'label', e.target.value)
                                  }
                                  placeholder="Label"
                                />
                                <input
                                  value={row.value || ''}
                                  onChange={(e) =>
                                    updatePositiveNegativeScale(test.testId, scaleIndex, 'value', e.target.value)
                                  }
                                  placeholder="Value / note"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {normalized.referenceMode !== 'numeric' && normalized.referenceMode !== 'positiveNegative' && (() => {
                          const { rows, extra } = parseBioRefRows(test.bioReference);
                          return (
                            <>
                              <div className="pew-rangerows">
                                {rows.map((r, i) => (
                                  <div className="pew-rangerow" key={`${test.testId}-row-${i}`}>
                                    <input
                                      placeholder="Label (e.g. Adult Male)"
                                      value={r.label}
                                      onChange={(e) =>
                                        updateRangeRow(test.testId, i, 'label', e.target.value)
                                      }
                                    />
                                    <input
                                      placeholder="Range (e.g. 0.72 - 1.18 mg/dL)"
                                      value={r.range}
                                      onChange={(e) =>
                                        updateRangeRow(test.testId, i, 'range', e.target.value)
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeRangeRow(test.testId, i)}
                                      title="Remove row"
                                      aria-label="Remove range row"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                className="pew-rangerow-add"
                                onClick={() => addRangeRow(test.testId)}
                                style={{ marginTop: rows.length ? 4 : 0 }}
                              >
                                <Plus size={14} />
                                Add range row
                              </button>
                              <details style={{ marginTop: 12 }}>
                                <summary
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    color: '#64748b'
                                  }}
                                >
                                  Advanced: free-text / grading scale
                                </summary>
                                <textarea
                                  rows={4}
                                  style={{ marginTop: 8 }}
                                  value={extra}
                                  onChange={(e) => setBioRefFromRows(test.testId, rows, e.target.value)}
                                  placeholder={
                                    '- : Negative\n+/- : Positive (15 mg/dL)\n+ : Positive (30 mg/dL)'
                                  }
                                />
                                <span className="pew-helper" style={{ marginTop: 4 }}>
                                  Used for non-cohort lines (e.g. dipstick grading). Appended below
                                  the structured rows in the PDF.
                                </span>
                              </details>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                  );
                })}
              </div>

              <div className="pew-section" style={{ marginTop: 20, background: '#f8fafc' }}>
                <div className="pew-section-head">
                  <h2>Add custom test</h2>
                </div>
                <p className="pew-helper" style={{ margin: '0 0 12px' }}>
                  Build a brand-new test that doesn’t exist in the catalog yet. After saving, it
                  appears in the test cards above and the catalog picker on next visit.
                </p>
                <div className="pew-fields">
                  <div className="pew-field pew-field--span-12">
                    <label>Start from report template</label>
                    <span className="pew-helper">Pre-fills the exact print words, method, specimen and reference scale.</span>
                    <select
                      value={newTest.reportTemplateName || ''}
                      onChange={(e) => {
                        const template = REPORT_TEST_TEMPLATES.find((item) => item.label === e.target.value);
                        if (template) applyNewTestTemplate(template);
                      }}
                    >
                      <option value="">Choose a urine / microscopy template...</option>
                      {REPORT_TEST_TEMPLATES.map((template) => (
                        <option key={template.label} value={template.label}>
                          {template.label}
                        </option>
                      ))}
                    </select>
                    <div className="pew-template-grid">
                      {REPORT_TEST_TEMPLATES.slice(0, 10).map((template) => (
                        <button
                          key={template.label}
                          type="button"
                          onClick={() => applyNewTestTemplate(template)}
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={`pew-field pew-field--span-6 ${formErrors.newTest_desc ? 'pew-field--error' : ''}`}>
                    <label>Description *</label>
                    <span className="pew-helper">Example: Serum Creatinine, Urine Albumin.</span>
                    <input
                      value={newTest.description}
                      onChange={(e) => {
                        setNewTest({ ...newTest, description: e.target.value });
                        if (formErrors.newTest_desc) {
                          setFormErrors((er) => ({ ...er, newTest_desc: undefined }));
                        }
                      }}
                      placeholder="New test name"
                    />
                    {formErrors.newTest_desc && (
                      <div className="pew-field-error">{formErrors.newTest_desc}</div>
                    )}
                  </div>
                  <div className="pew-field pew-field--span-6">
                    <label>Group / section</label>
                    <span className="pew-helper">Printed as the centered report heading.</span>
                    <input
                      value={newTest.sectionName}
                      onChange={(e) => setNewTest({ ...newTest, sectionName: e.target.value })}
                      placeholder={formData.name || 'CLINICAL PATHOLOGY'}
                    />
                    <div className="pew-chip-row">
                      {SECTION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewTest({ ...newTest, sectionName: preset })}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pew-field pew-field--span-6">
                    <label>Template name</label>
                    <span className="pew-helper">Name used by staff when reusing this test.</span>
                    <input
                      value={newTest.reportTemplateName}
                      onChange={(e) => setNewTest({ ...newTest, reportTemplateName: e.target.value })}
                      placeholder="e.g. Albumin urine"
                    />
                  </div>
                  <div className="pew-field pew-field--span-3">
                    <label>Units</label>
                    <span className="pew-helper">mg/dL, mmol/L, %, HPF…</span>
                    <input
                      value={newTest.unit}
                      onChange={(e) => setNewTest({ ...newTest, unit: e.target.value })}
                      placeholder="mg/dL"
                    />
                  </div>
                  <div className={`pew-field pew-field--span-3 ${formErrors.newTest_price ? 'pew-field--error' : ''}`}>
                    <label>Price (₹) *</label>
                    <span className="pew-helper">Charged when this test is part of a visit.</span>
                    <input
                      type="number"
                      value={newTest.price}
                      onChange={(e) => {
                        setNewTest({ ...newTest, price: e.target.value });
                        if (formErrors.newTest_price) {
                          setFormErrors((er) => ({ ...er, newTest_price: undefined }));
                        }
                      }}
                      placeholder="0"
                      min={0}
                      step={0.01}
                    />
                    {formErrors.newTest_price && (
                      <div className="pew-field-error">{formErrors.newTest_price}</div>
                    )}
                  </div>
                  <div className="pew-field pew-field--span-4">
                    <label>Sample type</label>
                    <span className="pew-helper">Specimen the test runs on.</span>
                    <select
                      value={newTest.sampleType}
                      onChange={(e) => setNewTest({ ...newTest, sampleType: e.target.value })}
                    >
                      {SAMPLE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pew-field pew-field--span-4">
                    <label>Result type</label>
                    <span className="pew-helper">How staff will enter results later.</span>
                    <select
                      value={newTest.inputType}
                      onChange={(e) => {
                        const inputType = e.target.value;
                        setNewTest({
                          ...newTest,
                          inputType,
                          resultOptions: inputType === 'select' && !newTest.resultOptions.trim()
                            ? DEFAULT_DROPDOWN_OPTIONS
                            : newTest.resultOptions
                        });
                      }}
                    >
                      {RESULT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pew-field pew-field--span-4">
                    <label>Print visibility</label>
                    <span className="pew-helper">Shown in the final lab report.</span>
                    <label className="pew-switch-row">
                      <input
                        type="checkbox"
                        checked={newTest.printVisible}
                        onChange={(e) => setNewTest({ ...newTest, printVisible: e.target.checked })}
                      />
                      Show in PDF
                    </label>
                  </div>
                  <div className="pew-field pew-field--span-8">
                    <label>Method</label>
                    <span className="pew-helper">One short line. Grading scales go in the structured rows below.</span>
                    <textarea
                      className="pew-textarea--method"
                      rows={2}
                      value={newTest.method}
                      onChange={(e) => setNewTest({ ...newTest, method: e.target.value })}
                      placeholder="Methodology (short)"
                    />
                    <div className="pew-chip-row">
                      {METHOD_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewTest({ ...newTest, method: preset })}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  {newTest.inputType === 'select' && (
                    <div className="pew-field pew-field--span-12">
                      <label>Dropdown values</label>
                      <span className="pew-helper">One option per line.</span>
                      <textarea
                        rows={3}
                        value={newTest.resultOptions}
                        onChange={(e) => setNewTest({ ...newTest, resultOptions: e.target.value })}
                        placeholder={'Negative\nTrace\nPositive'}
                      />
                    </div>
                  )}
                  <div className="pew-field pew-field--span-12">
                    <label>Reference range</label>
                    <span className="pew-helper">
                      Add one cohort per row after the test is added (Adult Male / Adult Female /
                      Child). For now you can paste raw multi-line text and convert it later.
                    </span>
                    <div className="pew-reference-mode">
                      {REFERENCE_MODE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={newTest.referenceMode === option.value ? 'pew-reference-mode--active' : ''}
                          onClick={() =>
                            setNewTest({
                              ...newTest,
                              referenceMode: option.value,
                              inputType: option.value === 'positiveNegative' ? 'select' : newTest.inputType,
                              resultOptions:
                                option.value === 'positiveNegative' && !newTest.resultOptions.trim()
                                  ? DEFAULT_DROPDOWN_OPTIONS
                                  : newTest.resultOptions,
                              bioReference:
                                option.value === 'positiveNegative'
                                  ? serializePositiveNegativeScale(DEFAULT_POSITIVE_NEGATIVE_SCALE)
                                  : newTest.bioReference,
                              positiveNegativeScale:
                                option.value === 'positiveNegative'
                                  ? DEFAULT_POSITIVE_NEGATIVE_SCALE
                                  : newTest.positiveNegativeScale
                            })
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {newTest.referenceMode === 'numeric' && (
                      <div className="pew-numeric-ref">
                        <input
                          value={newTest.refLow}
                          onChange={(e) => {
                            const refLow = e.target.value;
                            setNewTest({
                              ...newTest,
                              refLow,
                              bioReference:
                                refLow && newTest.refHigh
                                  ? `${refLow} - ${newTest.refHigh}`
                                  : (refLow ? `> ${refLow}` : (newTest.refHigh ? `< ${newTest.refHigh}` : ''))
                            });
                          }}
                          placeholder="Low, e.g. 0.72"
                        />
                        <input
                          value={newTest.refHigh}
                          onChange={(e) => {
                            const refHigh = e.target.value;
                            setNewTest({
                              ...newTest,
                              refHigh,
                              bioReference:
                                newTest.refLow && refHigh
                                  ? `${newTest.refLow} - ${refHigh}`
                                  : (newTest.refLow ? `> ${newTest.refLow}` : (refHigh ? `< ${refHigh}` : ''))
                            });
                          }}
                          placeholder="High, e.g. 1.18"
                        />
                        <span>{newTest.unit || 'unit optional'}</span>
                      </div>
                    )}
                    {newTest.referenceMode === 'positiveNegative' && (
                      <div className="pew-scale-editor">
                        {newTest.positiveNegativeScale.map((row, scaleIndex) => (
                          <div className="pew-scale-row" key={`new-scale-${scaleIndex}`}>
                            <input
                              value={row.symbol || ''}
                              onChange={(e) => {
                                const scale = newTest.positiveNegativeScale.map((item, itemIndex) =>
                                  itemIndex === scaleIndex ? { ...item, symbol: e.target.value } : item
                                );
                                setNewTest({ ...newTest, positiveNegativeScale: scale, bioReference: serializePositiveNegativeScale(scale) });
                              }}
                              placeholder="Symbol"
                            />
                            <input
                              value={row.label || ''}
                              onChange={(e) => {
                                const scale = newTest.positiveNegativeScale.map((item, itemIndex) =>
                                  itemIndex === scaleIndex ? { ...item, label: e.target.value } : item
                                );
                                setNewTest({ ...newTest, positiveNegativeScale: scale, bioReference: serializePositiveNegativeScale(scale) });
                              }}
                              placeholder="Label"
                            />
                            <input
                              value={row.value || ''}
                              onChange={(e) => {
                                const scale = newTest.positiveNegativeScale.map((item, itemIndex) =>
                                  itemIndex === scaleIndex ? { ...item, value: e.target.value } : item
                                );
                                setNewTest({ ...newTest, positiveNegativeScale: scale, bioReference: serializePositiveNegativeScale(scale) });
                              }}
                              placeholder="Value / note"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {newTest.referenceMode !== 'numeric' && newTest.referenceMode !== 'positiveNegative' && (
                      <textarea
                        rows={4}
                        value={newTest.bioReference}
                        onChange={(e) => setNewTest({ ...newTest, bioReference: e.target.value })}
                        placeholder="Multi-line reference / grading scale"
                      />
                    )}
                    <div className="pew-ref-presets">
                      {ALL_REFERENCE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setNewTest({
                              ...newTest,
                              inputType: preset.inputType,
                              referenceMode: preset.referenceMode,
                              sampleType: preset.sampleType || newTest.sampleType,
                              resultOptions: preset.resultOptions,
                              bioReference: preset.bioReference,
                              positiveNegativeScale:
                                preset.referenceMode === 'positiveNegative'
                                  ? DEFAULT_POSITIVE_NEGATIVE_SCALE
                                  : newTest.positiveNegativeScale
                            })
                          }
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setNewTest({
                            ...newTest,
                            inputType: 'select',
                            referenceMode: 'positiveNegative',
                            positiveNegativeScale: DEFAULT_POSITIVE_NEGATIVE_SCALE,
                            resultOptions: newTest.resultOptions.trim() || DEFAULT_DROPDOWN_OPTIONS,
                            bioReference: serializePositiveNegativeScale(DEFAULT_POSITIVE_NEGATIVE_SCALE)
                          })
                        }
                      >
                        Use negative / positive grading
                      </button>
                    </div>
                  </div>
                  <div className="pew-field pew-field--span-12">
                    <Button icon={Plus} onClick={handleAddTest}>
                      Add test to package
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {showSection(3) && (
            <section className="pew-section" ref={(el) => (sectionRefs.current.pricing = el)}>
              <div className="pew-section-head">
                <h2>Pricing</h2>
              </div>
              <div className="pew-fields">
                <div className="pew-field pew-field--span-4">
                  <label>Package price (₹)</label>
                  <span className="pew-helper">Total charged for the bundle.</span>
                  <input
                    type="number"
                    value={formData.packagePrice}
                    onChange={(e) => setFormData({ ...formData, packagePrice: e.target.value })}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="pew-field pew-field--span-4">
                  <label>Sum of test prices</label>
                  <input readOnly value={`₹${individualTotal.toFixed(2)}`} style={{ background: '#f1f5f9' }} />
                </div>
              </div>
            </section>
          )}

          {showSection(4) && (
            <section className="pew-section" ref={(el) => (sectionRefs.current.review = el)}>
              <div className="pew-section-head">
                <h2>Print preview & validation</h2>
                <span>{previewTests.length} printed / {formData.tests.length} total</span>
              </div>
              <div className="pew-preview-meta">
                <strong>{formData.name || '(no profile name)'}</strong>
                <span>Package Rs. {packageNum.toFixed(2)}</span>
                <span>Line total Rs. {individualTotal.toFixed(2)}</span>
                {hiddenPrintCount > 0 && <span>{hiddenPrintCount} hidden from print</span>}
              </div>
              {issueList.length > 0 && (
                <div className="pew-summary-error" style={{ marginBottom: 14 }}>
                  Fix {issueList.length} validation issue{issueList.length !== 1 ? 's' : ''} before saving.
                </div>
              )}
              <div className="pew-print-checklist">
                <div>
                  <strong>Report data checklist</strong>
                  <span>Each printable test should have section, method, result type, sample and reference values.</span>
                </div>
                <button type="button" className="pew-autofill-btn" onClick={autoFillMissingPrintDetails}>
                  Auto-fill missing print details
                </button>
                {formData.tests.length === 0 ? (
                  <p>No tests yet.</p>
                ) : (
                  <div className="pew-checklist-grid">
                    {formData.tests.map((test, index) => {
                      const normalized = normalizeTestForEditor(test);
                      const checks = getPrintChecks(normalized, formData.name);
                      const missing = Object.entries(checks)
                        .filter(([, ok]) => !ok)
                        .map(([key]) => key);
                      return (
                        <button
                          key={test.testId}
                          type="button"
                          className={missing.length ? 'pew-check-row pew-check-row--warn' : 'pew-check-row'}
                          onClick={() => scrollToTest(test.testId)}
                        >
                          <span>{index + 1}. {normalized.displayName || normalized.description || normalized.name}</span>
                          <small>{missing.length ? `Missing: ${missing.join(', ')}` : 'Ready for print'}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="pew-print-preview" aria-label="PDF-style print preview">
                <div className="pew-preview-patient">
                  <div><strong>NAME</strong> : Sample Patient</div>
                  <div><strong>COLLECTED ON</strong> : 08 May 2026, 09:30 am</div>
                  <div><strong>LAB NO.</strong> : PREVIEW-001</div>
                  <div><strong>RECIEVED ON</strong> : 08 May 2026, 10:00 am</div>
                  <div><strong>AGE/SEX</strong> : 55 Years / Female</div>
                  <div><strong>REPORTED ON</strong> : 08 May 2026, 12:30 pm</div>
                  <div><strong>PH NO</strong> : 9876543210</div>
                  <div><strong>REFERRED BY</strong> : SELF</div>
                  <div><strong>IP/OP</strong> : OP</div>
                  <div><strong>CORPORATE</strong> : THYROCARE LAB, KUNNATHPEEDIKA</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Test Description</th>
                      <th>Results & Unit</th>
                      <th>Biological Reference Interval</th>
                      <th>Sample Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewTests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="pew-preview-empty">
                          No printable tests. Turn on print visibility for at least one test.
                        </td>
                      </tr>
                    ) : (
                      previewGroups.map((group) => (
                        <Fragment key={group.name}>
                          <tr className="pew-preview-group">
                            <td colSpan={4}>{group.name}</td>
                          </tr>
                          {group.tests.map((test) => (
                            <tr key={test.testId}>
                              <td>
                                <strong>{test.displayName || test.description || test.name || '-'}</strong>
                                {test.method && <small>Method: {test.method}</small>}
                              </td>
                              <td className="pew-preview-result">
                                {formatPreviewResult(test).split('\n').map((line, index) => (
                                  <span key={`${test.testId}-result-${index}`}>{line}</span>
                                ))}
                              </td>
                              <td className="pew-preview-ref">{test.bioReference || '-'}</td>
                              <td className="pew-preview-sample">{test.sampleType || 'SERUM'}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="pew-preview-footer">
                  <span>HEALit Med Laboratories</span>
                  <span>Page 1 of 1</span>
                  <span>Signature appears on final report page only</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="pew-summary" aria-label="Package summary">
          <h3>Package summary</h3>
          <dl>
            <div className="pew-summary-row">
              <dt>Tests</dt>
              <dd>{formData.tests.length}</dd>
            </div>
            <div className="pew-summary-row">
              <dt>Line total</dt>
              <dd>₹{individualTotal.toFixed(2)}</dd>
            </div>
            <div className="pew-summary-row">
              <dt>Package price</dt>
              <dd>₹{packageNum.toFixed(2)}</dd>
            </div>
          </dl>
          {individualTotal > packageNum && packageNum > 0 && (
            <div className="pew-summary-highlight">
              Package is ₹{savings.toFixed(2)} below sum of parts (marketing discount).
            </div>
          )}
          {packageNum > individualTotal && (
            <div className="pew-summary-highlight" style={{ background: '#fff7ed', borderColor: '#fdba74', color: '#9a3412' }}>
              Package price exceeds sum of test prices — confirm this is intentional.
            </div>
          )}
        </aside>
      </div>

      <footer className="pew-footer">
        {step > 1 && (
          <Button variant="outline" onClick={prevStep}>
            Previous step
          </Button>
        )}
        {step < 4 && (
          <Button variant="primary" onClick={nextStep}>
            Next step
          </Button>
        )}
        <Button variant="outline" onClick={saveDraftManual}>
          Save draft now
        </Button>
        <Button variant="ghost" onClick={goBack}>
          Cancel
        </Button>
        <Button icon={Save} onClick={persistProfile}>
          {editingProfile ? 'Update profile' : 'Create profile'}
        </Button>
      </footer>
    </div>
  );
};

export default ProfileEditorWorkspace;
