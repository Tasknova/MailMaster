// Theme configuration for consistent colors across the application
export const theme = {
  colors: {
    primary: {
      50: 'bg-sky-50',
      100: 'bg-sky-100',
      500: 'bg-sky-500',
      600: 'bg-sky-600',
      700: 'bg-sky-700',
      800: 'bg-sky-800',
      900: 'bg-sky-900'
    },
    text: {
      primary: 'text-sky-600',
      secondary: 'text-sky-800',
      light: 'text-sky-100'
    },
    status: {
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      error: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
      info: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    },
    icons: {
      primary: 'text-sky-600',
      secondary: 'text-sky-800',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-sky-600',
      muted: 'text-muted-foreground'
    }
  }
};

// Helper function to get status color
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent':
      return theme.colors.status.success;
    case 'draft':
      return theme.colors.status.default;
    case 'scheduled':
      return theme.colors.status.info;
    case 'sending':
      return theme.colors.status.warning;
    case 'failed':
      return theme.colors.status.error; // Now uses blue instead of red
    default:
      return theme.colors.status.default;
  }
};

// Helper function to get icon color
export const getIconColor = (type: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted') => {
  return theme.colors.icons[type];
}; 