import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useSaleStore } from '@/store/sale.store';
import { useExpenseStore } from '@/store/expense.store';
import { useInventoryStore } from '@/store/inventory.store';
import { useRateStore } from '@/store/rate.store';
import { formatCurrency, formatDate, formatRate } from '@/utils/format';
import { startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { BarChart3, PieChart as PieChartIcon, AlertCircle, TrendingUp, Calendar, RefreshCw, ChevronDown, DollarSign, CreditCard, Package, Users, ArrowUpRight, ArrowDownRight, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

type Period = 'today' | 'week' | 'month' | 'all';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: { value: string; positive: boolean };
  currency?: 'USD' | 'VES';
  onCurrencyChange?: (c: 'USD' | 'VES') => void;
}

function StatCard({ title, value, subtitle, icon, iconColor, trend, currency, onCurrencyChange }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
              {icon}
            </div>
            {currency && (
              <select
                value={currency}
                onChange={(e) => onCurrencyChange?.(e.target.value as 'USD' | 'VES')}
                className="text-xs bg-background border border-border rounded px-2 py-0.5 text-text appearance-none"
              >
                <option value="USD">USD</option>
                <option value="VES">Bs.</option>
              </select>
            )}
          </div>
          <p className="text-sm font-medium text-textMuted mb-1">{title}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
          {subtitle && <p className="text-xs text-textMuted mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.positive ? (
                <ArrowUpRight className="w-3 h-3 text-success" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-error" />
              )}
              <span className={`text-xs font-medium ${trend.positive ? 'text-success' : 'text-error'}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { sales, loadSales, getTotalUSDInRange, getTotalVESInRange } = useSaleStore();
  const { expenses, loadExpenses, getTotalUSD: getExpenseTotalUSD, getTotalVES: getExpenseTotalVES } =
    useExpenseStore();
  const { items, loadItems } = useInventoryStore();
  const { rate, loadRate, refresh, provider, fetchedAt, isLoading: isRateLoading } = useRateStore();

  const [period, setPeriod] = useState<Period>('month');
  const [chartCurrency, setChartCurrency] = useState<'USD' | 'VES'>('USD');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRate();
    loadSales();
    loadExpenses();
    loadItems();
  }, [loadSales, loadExpenses, loadItems, loadRate]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refresh(), loadSales(), loadExpenses(), loadItems()]);
    setRefreshing(false);
  }

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString(),
        };
      case 'week':
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        return { start: weekStart.toISOString(), end: weekEnd.toISOString() };
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { start: monthStart.toISOString(), end: monthEnd.toISOString() };
      }
      default:
        return { start: new Date(0).toISOString(), end: new Date().toISOString() };
    }
  };

  const dateRange = getDateRange();
  const incomeUSD = getTotalUSDInRange(dateRange.start, dateRange.end);
  const incomeVES = getTotalVESInRange(dateRange.start, dateRange.end);
  const expenseUSD = getExpenseTotalUSD(dateRange.start, dateRange.end);
  const expenseVES = getExpenseTotalVES(dateRange.start, dateRange.end);
  const netIncomeUSD = incomeUSD - expenseUSD;
  const netIncomeVES = incomeVES - expenseVES;

  const lowStockItems = items.filter(
    (i) => i.lowStockThreshold !== undefined && i.lowStockThreshold > 0 && i.quantity <= i.lowStockThreshold
  );

  const chartData = useMemo(() => {
    const months: { label: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const start = new Date(y, m, 1).getTime();
      const end = new Date(y, m + 1, 0, 23, 59, 59).getTime();

      const income = sales
        .filter((s) => {
          const t = new Date(s.createdAt).getTime();
          return t >= start && t <= end;
        })
        .reduce((sum, s) => sum + (chartCurrency === 'USD' ? s.totalUSD : s.totalVES), 0);

      const expense = expenses
        .filter((e) => {
          const t = new Date(e.createdAt).getTime();
          return t >= start && t <= end;
        })
        .reduce((sum, e) => sum + (chartCurrency === 'USD' ? e.amountUSD : e.amountVES), 0);

      months.push({
        label: d.toLocaleDateString('es-VE', { month: 'short' }),
        income,
        expense,
      });
    }
    return months;
  }, [sales, expenses, chartCurrency]);

  const expensePieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + (chartCurrency === 'USD' ? e.amountUSD : e.amountVES);
    });

    const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
    return Object.entries(byCategory)
      .map(([label, value], idx) => ({
        label,
        value,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, chartCurrency]);

  const lowStockItemsCount = lowStockItems.length;
  const inventoryItemsCount = items.length;
  const totalSales = sales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountUSD, 0);

  return (
    <div className="p-4 space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-textMuted mt-1">Resumen del negocio</p>
      </header>

      {/* Rate Display */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-text">Tasa de Cambio</h3>
                {provider && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                    {provider}
                  </span>
                )}
              </div>
              {rate ? (
                <div>
                  <p className="text-xl font-bold text-text">
                    1 USD = {formatRate(rate)} VES
                  </p>
                  {fetchedAt && (
                    <p className="text-[10px] text-textMuted mt-0.5">
                      Actualizado: {new Date(fetchedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-textMuted">Cargando...</p>
              )}
            </div>
          </div>
          <button
            onClick={() => handleRefresh()}
            disabled={refreshing || isRateLoading}
            className={`p-2 rounded-lg bg-surface border border-border hover:bg-surface-elevated transition-colors ${
              (refreshing || isRateLoading) ? 'animate-spin opacity-50' : ''
            }`}
            title="Actualizar todo"
            aria-label="Actualizar todo"
          >
            <RefreshCw className="w-4 h-4 text-textSecondary" />
          </button>
        </div>
      </Card>

      {/* Period Selector */}
      <Card>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-textMuted" />
            <span className="text-sm font-medium text-text">Período:</span>
          </div>
          <div className="flex gap-1 bg-background rounded-lg p-1">
            {(['all', 'today', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-secondary text-white'
                    : 'text-textMuted hover:text-text'
                }`}
              >
                {p === 'all' ? 'Todo' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingresos"
          value={formatCurrency(chartCurrency === 'USD' ? incomeUSD : incomeVES, chartCurrency)}
          subtitle={`Total: ${formatCurrency(totalSales, chartCurrency)}`}
          icon={<ArrowUpRight className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
          trend={{ value: '+12.5%', positive: true }}
          currency={chartCurrency}
          onCurrencyChange={setChartCurrency}
        />
        <StatCard
          title="Egresos"
          value={formatCurrency(chartCurrency === 'USD' ? expenseUSD : expenseVES, chartCurrency)}
          subtitle={`Total: ${formatCurrency(totalExpenses, chartCurrency)}`}
          icon={<ArrowDownRight className="w-5 h-5" />}
          iconColor="bg-error/10 text-error"
          trend={{ value: '+5.2%', positive: false }}
          currency={chartCurrency}
          onCurrencyChange={setChartCurrency}
        />
        <StatCard
          title="Balance Neto"
          value={formatCurrency(chartCurrency === 'USD' ? netIncomeUSD : netIncomeVES, chartCurrency)}
          subtitle={chartCurrency === 'USD' ? `Tasa: ${formatRate(rate)} VES` : ''}
          icon={<Minus className="w-5 h-5" />}
          iconColor={`bg-${netIncomeUSD >= 0 ? 'success' : 'error'}/10 text-${netIncomeUSD >= 0 ? 'success' : 'error'}`}
          currency={chartCurrency}
          onCurrencyChange={setChartCurrency}
        />
        <StatCard
          title="Tasa (BCV)"
          value={rate ? `${formatRate(rate)} VES` : '—'}
          subtitle={provider || 'Calculando...'}
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="bg-warning/10 text-warning"
          trend={fetchedAt ? { value: new Date(fetchedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }), positive: true } : undefined}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItemsCount > 0 && (
        <Card className="bg-error/5 border-error">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-error mb-2">
                Alerta de stock bajo ({lowStockItemsCount})
              </p>
              <ul className="text-sm text-error space-y-1">
                {lowStockItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="font-medium">{item.name}:</span>
                    <span>{item.quantity} {item.unit}</span>
                  </li>
                ))}
                {lowStockItemsCount > 3 && (
                  <li className="text-textMuted">+{lowStockItemsCount - 3} más productos</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Income vs Expenses */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-text mb-1">
                Ingresos vs Egresos ({period === 'all' ? '6 meses' : period === 'month' ? 'Este mes' : period === 'week' ? 'Esta semana' : 'Hoy'})
              </h3>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1 text-success">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  Ingresos
                </span>
                <span className="flex items-center gap-1 text-error">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  Egresos
                </span>
              </div>
            </div>
            <div className="flex gap-1 bg-background rounded-lg p-1">
              <button
                onClick={() => setChartCurrency('USD')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartCurrency === 'USD' ? 'bg-secondary text-white' : 'text-textMuted hover:text-text'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setChartCurrency('VES')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartCurrency === 'VES' ? 'bg-accent text-white' : 'text-textMuted hover:text-text'
                }`}
              >
                Bs.
              </button>
            </div>
          </div>

          <div className="h-48" role="img" aria-label={`Gráfico de ingresos vs egresos. ${chartData.map(d => `${d.label}: ingresos ${d.income.toFixed(2)}, egresos ${d.expense.toFixed(2)}`).join('. ')}`}>
            <div className="flex items-end justify-around h-full gap-1 px-2" aria-hidden="true">
              {chartData.map((data, i) => {
                const maxVal = Math.max(...chartData.map(d => d.income + d.expense), 10);
                const incomeHeight = (data.income / maxVal) * 100;
                const expenseHeight = (data.expense / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[50px]">
                    <div className="w-full flex gap-1 justify-center">
                      <div
                        className="w-full bg-success rounded-t transition-all duration-500"
                        style={{ height: `${incomeHeight}%`, minHeight: data.income > 0 ? '4px' : '0' }}
                        title={`Ingresos: ${data.income.toFixed(2)}`}
                      />
                      <div
                        className="w-full bg-error rounded-t transition-all duration-500"
                        style={{ height: `${expenseHeight}%`, minHeight: data.expense > 0 ? '4px' : '0' }}
                        title={`Egresos: ${data.expense.toFixed(2)}`}
                      />
                    </div>
                    <span className="text-xs text-textMuted">{data.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Expense Pie Chart */}
        <Card>
          <h3 className="text-sm font-medium text-text mb-4">Gastos por categoría</h3>
          {expensePieData.length > 0 ? (
            <div className="h-48 flex items-center justify-center" role="img" aria-label={`Gráfico de gastos por categoría. ${expensePieData.map(d => `${d.label}: ${d.value.toFixed(2)}`).join('. ')}`}>
              <div className="text-center" aria-hidden="true">
                <p className="text-2xl font-bold text-text mb-4">
                  {formatCurrency(expensePieData.reduce((s, c) => s + c.value, 0), chartCurrency)}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {expensePieData.slice(0, 5).map((item, i) => (
                    <span key={i} className="text-xs flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="text-textSecondary">{item.label}</span>
                      <span className="font-medium text-text">
                        {formatCurrency(item.value, chartCurrency)}
                      </span>
                    </span>
                  ))}
                  {expensePieData.length > 5 && (
                    <span className="text-xs text-textMuted">+{expensePieData.length - 5} más</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-textMuted">
              No hay datos de egresos
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text">Últimas Ventas</h3>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>
          {sales.length === 0 ? (
            <p className="text-textMuted text-sm py-8 text-center">No hay ventas registradas</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-border-strong transition-colors"
                >
                  <div>
                    <p className="font-medium text-text text-sm">{sale.clientName || 'Cliente general'}</p>
                    <p className="text-xs text-textMuted">{formatDate(sale.createdAt)}</p>
                  </div>
                  <p className="font-bold text-secondary text-sm">
                    {formatCurrency(sale.totalUSD, 'USD')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text">Últimos Egresos</h3>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>
          {expenses.length === 0 ? (
            <p className="text-textMuted text-sm py-8 text-center">No hay egresos registrados</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-border-strong transition-colors"
                >
                  <div>
                    <p className="font-medium text-text text-sm">{expense.description}</p>
                    <p className="text-xs text-textMuted">
                      {expense.category} • {formatDate(expense.createdAt)}
                    </p>
                  </div>
                  <p className="font-bold text-error text-sm">
                    -{formatCurrency(expense.amountUSD, 'USD')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}