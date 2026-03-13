# DSA Support

Interactive **Data Structures & Algorithms Visualizer** built for learning DSA concepts step by step through animations, visual states, and readable execution logs.

## Overview

DSA Support is a browser-based educational project that helps students understand how common algorithms and data structures work visually.

The project currently includes:

- A **Sorting Visualizer** with step-by-step playback
- A **Trees & Graphs Visualizer** with BFS and DFS traversal
- A simple homepage that introduces the labs and learning goals

## Features

### Sorting Visualizer
- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- Shell Sort

You can:
- load a custom array
- use preset arrays
- shuffle values
- prepare the algorithm first
- move **one step at a time**
- use **auto play**
- reset and try again
- read the **step log** and current state metadata

### Trees & Graphs Visualizer
- Binary Tree visualization
- Graph visualization
- Breadth-First Search (BFS)
- Depth-First Search (DFS)

You can:
- load your own tree or graph input
- use sample structures
- set a **start node**
- set a **target node**
- watch traversal step by step
- track **frontier**, **visited**, and **current** node states

## Tech Stack

- **HTML**
- **CSS**
- **JavaScript**

No external framework is required. The project runs directly in the browser.

## Project Structure

```bash
DSASupport/
├── index.html          # Homepage
├── sorter.html         # Sorting visualizer page
├── structures.html     # Trees & graphs visualizer page
├── script.js           # Sorting visualizer logic
├── structures.js       # Trees & graphs logic
├── styles.css          # Shared styling
└── resources/          # Images / assets