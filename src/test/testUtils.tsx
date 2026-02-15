import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UserProvider } from '@/store/UserContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { VoiceProvider } from '@/store/VoiceContext';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with all necessary providers
 */
interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <VoiceProvider>
            {children}
          </VoiceProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

/**
 * Render with all providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Minimal wrapper - only BrowserRouter (for components that don't need auth)
 */
function MinimalWrapper({ children }: WrapperProps) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: MinimalWrapper, ...options });
}

/**
 * Wrapper with just UserProvider (for testing auth-related functionality)
 */
function AuthWrapper({ children }: WrapperProps) {
  return (
    <BrowserRouter>
      <UserProvider>{children}</UserProvider>
    </BrowserRouter>
  );
}

function renderWithAuth(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AuthWrapper, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Export custom render functions
export { customRender as render, renderWithRouter, renderWithAuth, AllProviders, AuthWrapper };
