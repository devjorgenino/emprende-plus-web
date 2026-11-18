import { NavLink } from 'react-router-dom';
import {
  Home,
  Calculator,
  ShoppingCart,
  Package,
  Users,
  Settings as SettingsIcon,
  BarChart3,
} from 'lucide-react';

const navigation = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Servicios', href: '/servicios', icon: Calculator },
  { name: 'Calculadora', href: '/calculadora', icon: Calculator },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Egresos', href: '/egresos', icon: BarChart3 },
  { name: 'Configuración', href: '/configuracion', icon: SettingsIcon },
];

export function NavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-elevation-2 pb-safe"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-8 gap-1 p-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-xl transition-colors duration-200 ${
                  isActive
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-textMuted hover:text-text hover:bg-surface/50'
                }`
              }
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}