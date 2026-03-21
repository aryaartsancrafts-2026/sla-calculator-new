/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRICING_CONFIG } from './config.js';
import { calculatePrice } from './pricingEngine.js';
import { parseSTL } from './stlParser.js';

// State Management
let appState = {
  file: null,
  volumeCm3: 0,
  dimensions: { x: 0, y: 0, z: 0 },
  estimatedTime: 0,
  inputs: {
    materialKey: 'standard',
    qualityKey: 'standard',
    structureKey: 'hollow',
    wallThickness: 2.0,
    supportsKey: 'auto',
    postProcessingKeys: [],
    quantity: 1,
    deliveryKey: 'standard',
    pincode: '',
  },
  result: null,
};

// DOM Elements
const elements = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  fileInfo: document.getElementById('file-info'),
  manualVolumeInput: document.getElementById('manual-volume'),
  inputsForm: document.getElementById('calculator-form'),
  priceDisplay: document.getElementById('final-price'),
  breakdownList: document.getElementById('price-breakdown'),
  statsDisplay: document.getElementById('model-stats'),
  savingsAlert: document.getElementById('savings-alert'),
  leadForm: document.getElementById('lead-form'),
  hollowOptions: document.getElementById('hollow-options'),
};

// Initialize UI
function init() {
  setupEventListeners();
  updateUI();
}

function setupEventListeners() {
  // File Upload
  elements.dropZone.addEventListener('click', () => elements.fileInput.click());
  elements.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('border-indigo-500', 'bg-indigo-50');
  });
  elements.dropZone.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
  });
  elements.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('border-indigo-500', 'bg-indigo-50');
    handleFile(e.dataTransfer.files[0]);
  });
  elements.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  // Manual Volume
  elements.manualVolumeInput.addEventListener('input', (e) => {
    appState.volumeCm3 = parseFloat(e.target.value) || 0;
    appState.estimatedTime = (appState.volumeCm3 / 10) * 0.5; // Heuristic
    recalculate();
  });

  // Form Inputs
  elements.inputsForm.addEventListener('change', (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (checked) {
        appState.inputs.postProcessingKeys.push(value);
      } else {
        appState.inputs.postProcessingKeys = appState.inputs.postProcessingKeys.filter(k => k !== value);
      }
    } else if (name === 'quantity') {
      appState.inputs.quantity = parseInt(value) || 1;
    } else {
      appState.inputs[name] = value;
    }

    // Toggle hollow options
    if (name === 'structureKey') {
      elements.hollowOptions.classList.toggle('hidden', value !== 'hollow');
    }

    recalculate();
  });

  // Lead Form
  elements.leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    console.log('Lead Captured:', { ...data, quote: appState.result });
    alert('Thank you! Our team will contact you shortly with a formal quote.');
  });
}

async function handleFile(file) {
  if (!file) return;
  
  elements.dropZone.innerHTML = `
    <div class="flex flex-col items-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
      <p class="text-sm text-gray-600">Analyzing ${file.name}...</p>
    </div>
  `;

  try {
    const result = await parseSTL(file);
    appState.file = file;
    appState.volumeCm3 = result.volumeCm3;
    appState.dimensions = result.dimensions;
    appState.estimatedTime = result.estimatedTime;
    
    elements.manualVolumeInput.value = result.volumeCm3.toFixed(2);
    updateFileInfo(result);
    recalculate();
  } catch (err) {
    console.error('STL Parsing failed:', err);
    alert('Failed to parse STL file. Please enter volume manually.');
    resetDropZone();
  }
}

function updateFileInfo(data) {
  elements.dropZone.innerHTML = `
    <div class="flex items-center space-x-4 p-2">
      <div class="bg-indigo-100 p-3 rounded-lg">
        <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>
      <div class="text-left">
        <p class="font-semibold text-gray-800 truncate max-w-[200px]">${data.fileName}</p>
        <p class="text-xs text-gray-500">${data.fileSize}</p>
      </div>
      <button type="button" onclick="window.location.reload()" class="text-xs text-indigo-600 hover:underline">Change</button>
    </div>
  `;
}

function resetDropZone() {
  elements.dropZone.innerHTML = `
    <div class="space-y-2">
      <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="flex text-sm text-gray-600">
        <span class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">Upload a file</span>
        <p class="pl-1">or drag and drop</p>
      </div>
      <p class="text-xs text-gray-500">STL, OBJ, 3MF up to 50MB</p>
    </div>
  `;
}

function recalculate() {
  const result = calculatePrice({
    ...appState.inputs,
    volumeCm3: appState.volumeCm3,
    printTimeHours: appState.estimatedTime,
  });
  appState.result = result;
  updateUI();
}

function updateUI() {
  const { result } = appState;
  if (!result) return;

  // Price
  elements.priceDisplay.textContent = `₹${result.finalPrice.toLocaleString()}`;

  // Breakdown
  elements.breakdownList.innerHTML = `
    <div class="flex justify-between text-sm py-1"><span>Material Cost</span><span>₹${result.breakdown.materialCost}</span></div>
    <div class="flex justify-between text-sm py-1"><span>Printing Cost</span><span>₹${result.breakdown.printingCost}</span></div>
    <div class="flex justify-between text-sm py-1"><span>Add-ons</span><span>₹${result.breakdown.addOns}</span></div>
    <div class="flex justify-between text-sm py-1"><span>Shipping</span><span>₹${result.breakdown.shipping}</span></div>
    ${result.breakdown.discount > 0 ? `<div class="flex justify-between text-sm py-1 text-green-600 font-medium"><span>Bulk Discount</span><span>-₹${result.breakdown.discount}</span></div>` : ''}
  `;

  // Stats
  elements.statsDisplay.innerHTML = `
    <div class="grid grid-cols-3 gap-2 text-center text-xs">
      <div class="bg-gray-50 p-2 rounded">
        <p class="text-gray-500 uppercase font-bold">Volume</p>
        <p class="font-semibold text-gray-800">${result.stats.volume} cm³</p>
      </div>
      <div class="bg-gray-50 p-2 rounded">
        <p class="text-gray-500 uppercase font-bold">Dimensions</p>
        <p class="font-semibold text-gray-800">${appState.dimensions.x}x${appState.dimensions.y}x${appState.dimensions.z}mm</p>
      </div>
      <div class="bg-gray-50 p-2 rounded">
        <p class="text-gray-500 uppercase font-bold">Est. Time</p>
        <p class="font-semibold text-gray-800">${result.stats.time} hrs</p>
      </div>
    </div>
  `;

  // Savings Alert
  if (result.breakdown.savingsHollow > 0) {
    elements.savingsAlert.innerHTML = `
      <div class="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">
              Smart Choice! You saved <span class="font-bold">₹${result.breakdown.savingsHollow}</span> by choosing Hollow structure.
            </p>
          </div>
        </div>
      </div>
    `;
  } else {
    elements.savingsAlert.innerHTML = '';
  }
}

// Start the app
init();
