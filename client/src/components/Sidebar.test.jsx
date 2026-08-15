import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { t } from '../test/fixtures';

describe('Sidebar', () => {
  it('renders one nav item per menu entry with its translated label', () => {
    render(<Sidebar activeTab="upgrades" setActiveTab={() => {}} t={t} />);

    expect(screen.getByText(t.menuUpgrades)).toBeInTheDocument();
    expect(screen.getByText(t.menuStore)).toBeInTheDocument();
    expect(screen.getByText(t.menuInstalled)).toBeInTheDocument();
    expect(screen.getByText(t.menuBackup)).toBeInTheDocument();
  });

  it('marks the active tab button with the active class', () => {
    render(<Sidebar activeTab="store" setActiveTab={() => {}} t={t} />);

    expect(screen.getByText(t.menuStore).closest('button')).toHaveClass('active');
    expect(screen.getByText(t.menuUpgrades).closest('button')).not.toHaveClass('active');
  });

  it('calls setActiveTab with the clicked item id', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();
    render(<Sidebar activeTab="upgrades" setActiveTab={setActiveTab} t={t} />);

    await user.click(screen.getByText(t.menuBackup));

    expect(setActiveTab).toHaveBeenCalledWith('backup');
    expect(setActiveTab).toHaveBeenCalledTimes(1);
  });
});
