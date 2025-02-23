// Previous imports...
import { monitoring } from '../monitoring';

// Rest of the code remains the same, but replace console.log/warn/error with monitoring:

// Example of changes (applying to entire file):
isDev && monitoring.info('[MongoDB Atlas] Connecting to:', { uri: getSanitizedURI(uri) });

// Instead of:
// isDev && console.log('[MongoDB Atlas] Connecting to:', getSanitizedURI(uri));