/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

/**
 * STL Parser for 3D Printing Calculator
 * Calculates volume and dimensions from STL file
 */

export async function parseSTL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(event.target.result);
        
        // Calculate Volume (cm³)
        // STL units are usually mm, so volume is in mm³
        // 1 cm³ = 1000 mm³
        const volumeMm3 = calculateVolume(geometry);
        const volumeCm3 = volumeMm3 / 1000;

        // Calculate Dimensions (mm)
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const dimensions = {
          x: (box.max.x - box.min.x).toFixed(1),
          y: (box.max.y - box.min.y).toFixed(1),
          z: (box.max.z - box.min.z).toFixed(1),
        };

        // Estimate Print Time (hours)
        // Simple heuristic: Height (Z) is the main factor for SLA
        // Standard SLA speed: ~10-20mm per hour depending on layer height
        const heightMm = parseFloat(dimensions.z);
        const estimatedTime = heightMm / 10; // 10mm/hour as base

        resolve({
          volumeCm3,
          dimensions,
          estimatedTime,
          fileName: file.name,
          fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Calculate volume of a BufferGeometry
 * Based on signed volume of tetrahedra
 */
function calculateVolume(geometry) {
  let volume = 0;
  const position = geometry.attributes.position;
  const faces = position.count / 3;

  for (let i = 0; i < faces; i++) {
    const v1 = new THREE.Vector3().fromBufferAttribute(position, i * 3 + 0);
    const v2 = new THREE.Vector3().fromBufferAttribute(position, i * 3 + 1);
    const v3 = new THREE.Vector3().fromBufferAttribute(position, i * 3 + 2);
    
    volume += signedVolumeOfTriangle(v1, v2, v3);
  }
  return Math.abs(volume);
}

function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.cross(p3)) / 6.0;
}
