import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpgradesTab from './UpgradesTab';
import { t } from '../test/fixtures';

const apps = [
  { id: 'Google.Chrome', name: 'Google Chrome', version: '120.0', available: '121.0' },
  { id: 'Igor.7zip', name: '7-Zip', version: '23.0', available: '23.1' },
];

function baseProps(overrides = {}) {
  return {
    apps: [],
    loading: false,
    error: null,
    selectedApps: new Set(),
    isUpgrading: false,
    logs: [],
    checkUpdates: vi.fn(),
    toggleSelect: vi.fn(),
    toggleSelectAll: vi.fn(),
    startUpgrade: vi.fn(),
    cancelUpgrade: vi.fn(),
    t,
    ...overrides,
  };
}

describe('UpgradesTab', () => {
  it('shows the empty state when there are no upgradable apps', () => {
    render(<UpgradesTab {...baseProps()} />);
    expect(screen.getByText(t.noUpdates)).toBeInTheDocument();
  });

  it('renders one row per app with its name, id and versions', () => {
    render(<UpgradesTab {...baseProps({ apps, selectedApps: new Set(apps.map((a) => a.id)) })} />);

    expect(screen.getByText('Google Chrome')).toBeInTheDocument();
    expect(screen.getByText('Google.Chrome')).toBeInTheDocument();
    expect(screen.getByText('120.0')).toBeInTheDocument();
    expect(screen.getByText('121.0')).toBeInTheDocument();
    expect(screen.getByText('7-Zip')).toBeInTheDocument();
  });

  it('disables "upgrade selected" until at least one app is selected', () => {
    render(<UpgradesTab {...baseProps({ apps, selectedApps: new Set() })} />);
    expect(screen.getByText(t.upgradeSelected).closest('button')).toBeDisabled();
  });

  it('calls startUpgrade("select") when "upgrade selected" is clicked with a selection', async () => {
    const user = userEvent.setup();
    const startUpgrade = vi.fn();
    render(<UpgradesTab {...baseProps({ apps, selectedApps: new Set(['Google.Chrome']), startUpgrade })} />);

    await user.click(screen.getByText(t.upgradeSelected));

    expect(startUpgrade).toHaveBeenCalledWith('select');
  });

  it('shows a cancel button instead of the upgrade actions while upgrading', async () => {
    const user = userEvent.setup();
    const cancelUpgrade = vi.fn();
    render(<UpgradesTab {...baseProps({ apps, isUpgrading: true, cancelUpgrade })} />);

    expect(screen.queryByText(t.upgradeAll)).not.toBeInTheDocument();
    await user.click(screen.getByText(t.cancel));
    expect(cancelUpgrade).toHaveBeenCalledTimes(1);
  });

  it('toggles an individual row checkbox via toggleSelect', async () => {
    const user = userEvent.setup();
    const toggleSelect = vi.fn();
    render(<UpgradesTab {...baseProps({ apps, toggleSelect })} />);

    await user.click(screen.getByLabelText('Google Chrome seç'));

    expect(toggleSelect).toHaveBeenCalledWith('Google.Chrome');
  });
});
