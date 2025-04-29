/**
 * Copyright (c) 2024, Daily
 *
 * SPDX-License-Identifier: BSD 2-Clause License
 */

import { LGraph, LiteGraph } from "litegraph.js";
import 'litegraph.js/css/litegraph.css';

import { registerNodes } from "./nodes/index.js";
import { SidePanel } from "./editor/sidePanel.js";
import { Toolbar } from "./editor/toolbar.js";
import { setupCanvas } from "./editor/canvas.js";
import { editorState } from "./editor/editorState.js";

// --- Configuration ---
const ADMIN_LOGIN_URL = 'https://admin.carecycle.ai/login';
// Use production API URL. For local dev, you might need to change this or use environment variables.
const API_VALIDATION_URL = 'https://api.nodable.ai/api/admin/auth/validate'; 
const AUTH_MESSAGE_ID = 'auth-loading-message'; // ID for the loading message element

// Clear all default node types
LiteGraph.clearRegisteredTypes();

/**
 * Initializes the LiteGraph editor UI and components.
 */
function initializeApp() {
  // Remove the loading message specifically
  const loadingMessage = document.getElementById(AUTH_MESSAGE_ID);
  if (loadingMessage) {
    loadingMessage.remove();
  }

  // Defer the UI setup until the next animation frame to ensure DOM is ready
  requestAnimationFrame(() => {
    try {
      // Initialize graph
      const graph = new LGraph();

      // Register node types
      registerNodes();

      // Setup UI components
      const canvas = setupCanvas(graph);
      const sidePanel = new SidePanel(graph);
      const toolbar = new Toolbar(graph);

      // Register side panel with editor state
      editorState.setSidePanel(sidePanel);

      // Add graph change listener
      graph.onAfterChange = () => {
        graph._nodes.forEach((node) => {
          if (node.onAfterGraphChange) {
            node.onAfterGraphChange();
          }
        });
      };

      // Handle node selection
      graph.onNodeSelected = (node) => {
        editorState.updateSidePanel(node);
      };

      graph.onNodeDeselected = () => {
        editorState.updateSidePanel(null);
      };

      // Start the graph
      graph.start();
      console.log("LiteGraph editor initialized successfully within animation frame.");
    } catch (error) {
        console.error("Error during deferred UI initialization:", error);
        // Optionally display an error to the user here instead of redirecting,
        // as the auth itself was successful.
        document.body.innerHTML = 
          `<p style="padding: 20px; font-family: sans-serif; color: red;">Error initializing editor UI after authentication. Please check console.</p>`;
    }
  });
}

/**
 * Checks for authentication token in URL, validates it with the backend,
 * and initializes the app if valid.
 */
async function checkAuthAndInitialize() {
  // Create and append the loading message
  const loadingMessage = document.createElement('p');
  loadingMessage.id = AUTH_MESSAGE_ID;
  loadingMessage.style.padding = '20px';
  loadingMessage.style.fontFamily = 'sans-serif';
  loadingMessage.textContent = 'Authenticating...';
  document.body.appendChild(loadingMessage);

  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');

  // Immediately remove the token from the URL
  if (token) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (!token) {
    console.log("No token found in URL. Redirecting to login.");
    window.location.href = ADMIN_LOGIN_URL;
    return;
  }

  try {
    const response = await fetch(API_VALIDATION_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log("Token validated successfully. Initializing editor.");
      initializeApp(); // Token is valid, initialize the editor
    } else {
      console.error("Token validation failed:", response.status, response.statusText);
      const errorMessage = document.getElementById(AUTH_MESSAGE_ID);
      if (errorMessage) {
         errorMessage.style.color = 'red';
         errorMessage.textContent = 'Authentication failed. Redirecting to login...';
      }
      // Wait a moment before redirecting so user might see the message
      setTimeout(() => { window.location.href = ADMIN_LOGIN_URL; }, 2000);
    }
  } catch (error) {
    console.error("Error during token validation request:", error);
    const errorMessage = document.getElementById(AUTH_MESSAGE_ID);
    if (errorMessage) {
       errorMessage.style.color = 'red';
       errorMessage.textContent = 'Error during authentication. Redirecting to login...';
    }
    // Wait a moment before redirecting
    setTimeout(() => { window.location.href = ADMIN_LOGIN_URL; }, 2000);
  }
}

// Start the auth check process when the DOM is ready
document.addEventListener("DOMContentLoaded", checkAuthAndInitialize);
