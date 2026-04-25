import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the GarudaAI dashboard heading', () => {
  render(<App />);
  const headingElement = screen.getByText(
    /real-time soldier safety dashboard/i
  );
  expect(headingElement).toBeInTheDocument();
});
