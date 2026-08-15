import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoreTab from './StoreTab';
import { t } from '../test/fixtures';

function baseProps(overrides = {}) {
  return {
    socket: { emit: vi.fn() },
    SERVER_URL: 'http://localhost:3001',
    logs: [],
    setLogs: vi.fn(),
    isProcessing: false,
    setIsProcessing: vi.fn(),
    t,
    ...overrides,
  };
}

describe('StoreTab', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('disables the search button until a query is typed', () => {
    render(<StoreTab {...baseProps()} />);
    expect(screen.getByText(t.search).closest('button')).toBeDisabled();
  });

  it('searches via the server API and renders results', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        apps: [{ id: 'Google.Chrome', name: 'Google Chrome', version: '121.0', source: 'winget' }],
      }),
    });

    render(<StoreTab {...baseProps()} />);
    await user.type(screen.getByPlaceholderText(t.searchPlaceholder), 'chrome');
    await user.click(screen.getByText(t.search));

    await waitFor(() => expect(screen.getByText('Google Chrome')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/search?q=chrome');
  });

  it('shows the "no results" message when the search comes back empty', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValue({ ok: true, json: async () => ({ apps: [] }) });

    render(<StoreTab {...baseProps()} />);
    await user.type(screen.getByPlaceholderText(t.searchPlaceholder), 'doesnotexist');
    await user.click(screen.getByText(t.search));

    await waitFor(() => expect(screen.getByText(t.noResults)).toBeInTheDocument());
  });

  it('emits start-install with the package id when Install is clicked', async () => {
    const user = userEvent.setup();
    const socket = { emit: vi.fn() };
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        apps: [{ id: 'Google.Chrome', name: 'Google Chrome', version: '121.0', source: 'winget' }],
      }),
    });

    render(<StoreTab {...baseProps({ socket })} />);
    await user.type(screen.getByPlaceholderText(t.searchPlaceholder), 'chrome');
    await user.click(screen.getByText(t.search));
    await waitFor(() => expect(screen.getByText('Google Chrome')).toBeInTheDocument());

    await user.click(screen.getByText(t.install));

    expect(socket.emit).toHaveBeenCalledWith('start-install', { id: 'Google.Chrome' });
  });
});
