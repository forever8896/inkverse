# Monster Generation Hooks & Components

This modular system provides comprehensive client-side state management and UI components for monster generation functionality. Built with Zustand for state management and designed for reusability across the application.

## Core Architecture

### Zustand Store (`/stores/monster-generation.ts`)
- Centralized state management for all monster generation data
- Automatic polling management with cleanup
- Built-in error handling and loading states
- Devtools integration for debugging

### React Hooks (`/hooks/useMonsterGeneration.ts`)
- High-level hooks that abstract store interactions
- Automatic authentication error handling
- Performance-optimized selectors
- Cleanup on component unmount

### UI Components (`/components/monster-generation/`)
- Modular, reusable components for displaying generation status
- Consistent styling and animations
- Error boundaries and loading states
- Interactive elements with proper accessibility

## Quick Start

### 1. Monitor a Job with Auto-Polling

```tsx
import { useJobMonitor } from '@/hooks/useMonsterGeneration';

function MyComponent({ jobId }: { jobId: string }) {
  const {
    job,
    status,
    progress,
    isCompleted,
    isFailed,
    isProcessing,
    error
  } = useJobMonitor(jobId); // Automatically starts polling

  if (isCompleted) {
    return <div>🎉 Monster ready!</div>;
  }

  if (isProcessing) {
    return <div>Creating... {progress}%</div>;
  }

  return null;
}
```

### 2. Display Full Job Status

```tsx
import { JobStatusCard } from '@/components/monster-generation';

function StatusPage({ jobId }: { jobId: string }) {
  return (
    <div>
      <JobStatusCard jobId={jobId} />
    </div>
  );
}
```

### 3. Show Progress with Steps

```tsx
import { ProgressBar, ProgressSteps } from '@/components/monster-generation';

function ProgressPage({ jobId }: { jobId: string }) {
  const { progress, status } = useJobMonitor(jobId);

  return (
    <div className="space-y-6">
      <ProgressBar progress={progress} status={status || ''} />
      <ProgressSteps jobId={jobId} />
    </div>
  );
}
```

### 4. Display Results When Complete

```tsx
import { JobResults } from '@/components/monster-generation';

function ResultsPage({ jobId }: { jobId: string }) {
  const { isCompleted } = useJobMonitor(jobId);

  return (
    <div>
      {isCompleted && (
        <JobResults 
          jobId={jobId}
          showViewer={true}
          showActions={true}
        />
      )}
    </div>
  );
}
```

## Available Hooks

### `useMonsterGeneration()`
Main hook providing all store functions with auth handling.

```tsx
const {
  // State
  jobs,
  activeJobId,
  loading,
  error,
  
  // Actions
  setActiveJob,
  fetchJobStatus,
  startPolling,
  stopPolling,
  
  // Utilities
  getJob,
  isJobCompleted,
  cleanup
} = useMonsterGeneration();
```

### `useJobMonitor(jobId, autoStart?)`
Monitor a specific job with automatic polling.

```tsx
const {
  job,
  status,
  progress,
  pollCount,
  error,
  loading,
  isCompleted,
  isFailed,
  isProcessing,
  statusMessage,
  statusEmoji,
  refresh,
  startMonitoring,
  stopMonitoring
} = useJobMonitor('job-123');
```

### `useJobProgress(jobId)`
Get detailed progress information with step mapping.

```tsx
const {
  progress,
  status,
  currentStep,
  steps,
  isCompleted,
  isProcessing
} = useJobProgress('job-123');
```

### `useJobResults(jobId)`
Access job results (images, models, metadata).

```tsx
const {
  job,
  hasResults,
  imageUrl,
  glbUrl,
  totalCost,
  prompt,
  style,
  stage
} = useJobResults('job-123');
```

### `useJobCollection(jobIds)`
Manage multiple jobs for history/dashboard views.

```tsx
const {
  jobs,
  refreshAll,
  getCompletedJobs,
  getProcessingJobs,
  totalJobs,
  completedCount
} = useJobCollection(['job-1', 'job-2', 'job-3']);
```

## Available Components

### `<JobStatusCard jobId={string} />`
Main status display with emoji, message, and progress.

### `<ProgressBar progress={number} status={string} />`
Animated progress bar with shimmer effects.

### `<ProgressSteps jobId={string} />`
Step-by-step progress visualization.

### `<JobResults jobId={string} showViewer? showActions? />`
Complete results display with 3D viewer and download links.

### `<JobErrorState jobId={string} showActions? />`
Error state with retry actions.

### `<StatusWidget jobId={string} size? clickable? onClick? />`
Compact status widget for headers, sidebars, etc.

## Advanced Usage

### Custom Polling Intervals

```tsx
const { startPolling } = useMonsterGeneration();

// Poll every 1 second instead of default 3 seconds
startPolling('job-123', 1000);
```

### Manual Status Refresh

```tsx
const { refresh } = useJobMonitor('job-123', false); // Don't auto-start

// Manually trigger refresh
const handleRefresh = () => {
  refresh();
};
```

### Error Handling

```tsx
const { error, clearError } = useMonsterGeneration();

if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

### Store Access for Complex Cases

```tsx
import { useMonsterGenerationStore } from '@/stores/monster-generation';

function AdvancedComponent() {
  const store = useMonsterGenerationStore();
  
  // Direct store access for complex operations
  const handleBulkUpdate = () => {
    store.stopAllPolling();
    // ... complex logic
  };

  return <div>Advanced functionality</div>;
}
```

## Performance Considerations

### Selector Optimization
The store uses performance-optimized selectors:

```tsx
// ✅ Optimized - only re-renders when this job changes
const job = useJob('job-123');

// ✅ Optimized - only re-renders when status changes
const status = useJobStatus('job-123');

// ❌ Not optimized - re-renders when any store state changes
const { jobs } = useMonsterGeneration();
const job = jobs['job-123'];
```

### Cleanup
Components automatically clean up polling on unmount, but for complex scenarios:

```tsx
useEffect(() => {
  return () => {
    // Manual cleanup if needed
    store.cleanup();
  };
}, []);
```

## Error Handling

The system includes comprehensive error handling:

- **Authentication errors**: Automatic redirect to auth page
- **Network errors**: Exposed through `error` state
- **Invalid responses**: Graceful degradation
- **Polling failures**: Automatic retry with exponential backoff

## Integration Examples

See `ExampleUsage.tsx` for complete examples including:
- Header notifications for active generations
- Dashboard widgets showing recent generations  
- Inline job monitors for any page
- Sidebar with active generation tracking
- Mini cards for completed monsters

## TypeScript Support

All hooks and components are fully typed with comprehensive interfaces exported from the store for external use.