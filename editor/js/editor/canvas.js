/**
 * Copyright (c) 2024, Daily
 *
 * SPDX-License-Identifier: BSD 2-Clause License
 */

import { LGraphCanvas } from "litegraph.js";

/**
 * Sets up the canvas and its event handlers
 * @param {LGraph} graph - The LiteGraph instance
 * @returns {LGraphCanvas} The configured canvas instance
 */
export function setupCanvas(graph) {
  const canvas = new LGraphCanvas("#graph-canvas", graph);

  // Defensively check if zoom buttons exist before adding handlers
  const zoomInButton = document.getElementById("zoom-in");
  if (zoomInButton) {
      zoomInButton.onclick = () => {
        if (canvas.ds.scale < 2) {
          // Limit max zoom
          canvas.ds.scale *= 1.2;
          canvas.setDirty(true, true);
        }
      };
  } else {
      console.warn("Zoom In button (#zoom-in) not found in DOM during setupCanvas.");
  }

  const zoomOutButton = document.getElementById("zoom-out");
  if (zoomOutButton) {
      zoomOutButton.onclick = () => {
        if (canvas.ds.scale > 0.2) {
          // Limit min zoom
          canvas.ds.scale *= 0.8;
          canvas.setDirty(true, true);
        }
      };
  } else {
      console.warn("Zoom Out button (#zoom-out) not found in DOM during setupCanvas.");
  }

  /**
   * Resizes the canvas to fit its container, adjusting for device pixel ratio.
   */
  function resizeCanvas() {
    const canvasElement = document.getElementById("graph-canvas");
    const container = document.getElementById("graph-container");

    if (!canvasElement || !container) {
        console.error("Canvas or container element not found for resizing.");
        return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect(); // Use getBoundingClientRect for more precise dimensions

    // Set the canvas drawing buffer size (actual pixels)
    canvasElement.width = rect.width * dpr;
    canvasElement.height = rect.height * dpr;

    // Set the canvas display size (CSS pixels)
    canvasElement.style.width = `${rect.width}px`;
    canvasElement.style.height = `${rect.height}px`;

    // Get the canvas 2D context and scale it
    const ctx = canvasElement.getContext('2d');
    if (ctx) {
        ctx.scale(dpr, dpr); // Scale the context to match the DPR
    } else {
        console.warn("Could not get 2D context to scale canvas.");
    }


    // Inform LiteGraphCanvas about the resize/rescale if necessary
    // LiteGraphCanvas might automatically detect changes or might need an explicit update.
    // Check LiteGraph documentation if rendering issues persist after this change.
    // Forcing a redraw is usually a good idea after resize.
    if (canvas && canvas.resize) {
        // LGraphCanvas usually handles internal resizing/redrawing when its element resizes,
        // but explicitly calling resize might be needed depending on the version/implementation.
        // canvas.resize(canvasElement.width, canvasElement.height); // This might override our DPR scaling, test carefully
        canvas.setDirty(true, true); // Mark canvas as dirty to force redraw
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  return canvas;
}
