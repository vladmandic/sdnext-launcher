# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **Main**: Add JSDoc documentation to IPC helper functions and handlers
- **Main**: Centralize status message constants in shared module  
- **Main**: Add JSDoc to all IPC handlers for complete API documentation
- **Main**: Use centralized error formatters for consistent error messages
- **Main**: Update main.ts to use STATUS constants
- **Main**: Make wipe-path deletion async to avoid blocking the UI thread
- **Main**: Emit xterm wipe start/end/failure messages with elapsed time
- **Renderer**: Use STATUS constants for bootstrap status checks
- **Renderer**: Status panel now highlights package names with Consolas font and accent color when displaying "Installing: xxx"

- **Shared**: Add status constants file for consistent status strings across IPC

### Fixed
- **Renderer**: Install progress bar "packages" count now updates correctly by stripping ANSI escape codes before regex matching
- **Renderer**: Remove redundant "Current" package display from install progress bar (already shown in status panel)
- **Renderer**: Install progress bar visual fill now displays correctly by adding missing CSS color variable

### Improved
- **Main**: Improve code maintainability with comprehensive JSDoc comments
- **Main**: Replace hardcoded status strings with centralized constants
- **Main**: Replace error type casts with type guard utility functions
- **Main**: Improved error handling with getErrorMessage helper

- **Shared**: Add error formatter helpers (formatError, formatInstallError, formatBootstrapRequired)
- **Shared**: Add bootstrap sub-status constants for renderer use
- **Shared**: Add type guard utilities (isError, getErrorMessage)
