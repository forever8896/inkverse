# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MonstersInk!** is an interactive learning platform that teaches Polkadot and ink! smart contract development through creature creation. Users progress through lessons and chapters by writing ink! contract code that brings digital creatures to life.

## Project Status & Code Quality Standards

**Current State:** This project was built as a hackathon MVP that successfully won the competition. The codebase contains quick fixes and solutions optimized for demo purposes rather than production stability.

**Going Forward:** We are now transitioning to production-ready development with focus on:

- **Stability**: Robust error handling, proper state management, comprehensive testing
- **Maintainability**: Clean architecture, proper separation of concerns, readable code
- **Extensibility**: Well-defined interfaces, modular design, plugin architecture for content
- **Documentation**: Comprehensive code documentation, API documentation, contributor guides
- **Open Source Standards**: Clear contribution guidelines, consistent code style, proper licensing

**Development Approach:**

- Refactor existing quick fixes into proper, tested solutions
- Add comprehensive TypeScript types and interfaces
- Implement proper error boundaries and loading states
- Add unit tests and integration tests for all components
- Create proper data validation and sanitization
- Establish consistent coding patterns and architectural decisions

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests with Vitest
- `npm run typecheck` - TypeScript type checking
- `npm run format` - Format code with Prettier

## Architecture

### Core Application Structure

The app uses Next.js 15 with React Server Components and has two main learning paths:

1. **Lessons** (`/src/lib/lessons.ts`) - Step-by-step ink! tutorials with validation
2. **Chapters** (`/src/lib/chapters.ts`) - Story-driven creature creation labs

### Key Components

- **CreatureCreationLab** (`/src/components/CreatureCreationLab.tsx`) - Interactive coding environment with split-panel design (content + code editor)
- **CodeEditor** (`/src/components/CodeEditor.tsx`) - Monaco-based editor for ink! smart contracts
- **LessonLayout** (`/src/components/LessonLayout.tsx`) - Layout wrapper for lesson progression

### Data Models

Both lessons and chapters use a structured approach with:

- **Validation rules** - Pattern matching to check user code correctness
- **Step progression** - Sequential learning with prerequisites
- **Reward system** - Achievement tracking for completed tasks

### Content Structure

- `/src/app/lessons/[id]/` - Individual lesson pages
- `/src/app/lab/chapter/[id]/` - Chapter-based creature creation labs
- `/public/creatures/` - Creature artwork and animations (PNG/WebM formats)

### Validation System

The platform uses client-side code validation with rules defined in lesson/chapter data:

- `includes` - Must contain specific patterns
- `excludes` - Must not contain patterns
- `regex` - Custom regex matching

Code validation happens in real-time as users progress through ink! contract development steps.

## Technology Stack

- **Framework**: Next.js 15 with Turbopack
- **Styling**: Tailwind CSS v4
- **Animation**: Motion library (Framer Motion successor)
- **Language**: TypeScript
- **Code Editor**: Monaco Editor (for ink!/Rust syntax)

## Content Focus

The application teaches ink! smart contract development through:

- Basic contract structure and storage
- Constructor and message functions
- Blockchain deployment concepts
- Integration with PopCLI terminal

Educational content is structured as a gamified bio-engineering experience where users create digital creatures by writing working ink! smart contracts.
