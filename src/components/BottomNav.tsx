import { NavLink } from 'react-router-dom';
import { IconCalculator, IconSettings, IconSuitcase } from './icons';

const ITEMS = [
  { to: '/', label: 'Calculadora', Icon: IconCalculator, end: true },
  { to: '/viajes', label: 'Viajes', Icon: IconSuitcase, end: false },
  { to: '/configuracion', label: 'Config.', Icon: IconSettings, end: false },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => 'bottom-nav-item' + (isActive ? ' active' : '')}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
