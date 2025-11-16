import React, { useMemo } from 'react';
import { useFinancialStore, useTestResultStore } from '../../../store';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import './ProfitLoss.css';

const ProfitLoss = () => {
  const { expenses, revenue } = useFinancialStore();
  const { results } = useTestResultStore();

  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const calculateRevenue = (startDate, endDate = new Date()) => {
    // Calculate from test results (assuming each test has a price)
    const testRevenue = results
      .filter(r => {
        const resultDate = new Date(r.date || r.createdAt);
        return resultDate >= startDate && resultDate <= endDate;
      })
      .reduce((sum, r) => sum + (r.totalPrice || 500), 0); // Default 500 if no price

    // Add any manual revenue entries
    const manualRevenue = revenue
      .filter(r => {
        const revDate = new Date(r.date);
        return revDate >= startDate && revDate <= endDate;
      })
      .reduce((sum, r) => sum + r.amount, 0);

    return testRevenue + manualRevenue;
  };

  const calculateExpenses = (startDate, endDate = new Date()) => {
    return expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const periods = [
    { name: 'Today', start: startOfToday },
    { name: 'This Week', start: startOfWeek },
    { name: 'This Month', start: startOfMonth },
    { name: 'This Year', start: startOfYear },
  ];

  const financialData = periods.map(period => {
    const rev = calculateRevenue(period.start);
    const exp = calculateExpenses(period.start);
    const profit = rev - exp;

    return {
      period: period.name,
      revenue: rev,
      expenses: exp,
      profit: profit,
      profitMargin: rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0,
    };
  });

  // Monthly comparison (last 12 months)
  const monthlyComparison = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const rev = calculateRevenue(date, monthEnd);
      const exp = calculateExpenses(date, monthEnd);

      months.push({
        month: monthName,
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
      });
    }
    
    return months;
  }, [expenses, results, revenue]);

  const maxValue = Math.max(
    ...monthlyComparison.map(m => Math.max(m.revenue, m.expenses)),
    1
  );

  const exportProfitLossReport = () => {
    const headers = ['Period', 'Revenue', 'Expenses', 'Profit', 'Profit Margin (%)'];
    const rows = financialData.map(d => [
      d.period,
      d.revenue.toFixed(2),
      d.expenses.toFixed(2),
      d.profit.toFixed(2),
      d.profitMargin
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit_loss_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="profit-loss">
      <div className="profit-loss-header">
        <h2>💰 Profit & Loss Statement</h2>
        <Button variant="primary" onClick={exportProfitLossReport}>
          📥 Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="pl-summary-grid">
        {financialData.map((data, index) => (
          <Card key={index}>
            <div className="pl-card">
              <h3>{data.period}</h3>
              <div className="pl-row">
                <span className="pl-label">Revenue:</span>
                <span className="pl-value revenue">₹{data.revenue.toFixed(2)}</span>
              </div>
              <div className="pl-row">
                <span className="pl-label">Expenses:</span>
                <span className="pl-value expenses">₹{data.expenses.toFixed(2)}</span>
              </div>
              <div className="pl-divider"></div>
              <div className="pl-row profit-row">
                <span className="pl-label">Profit:</span>
                <span className={`pl-value ${data.profit >= 0 ? 'profit' : 'loss'}`}>
                  ₹{data.profit.toFixed(2)}
                </span>
              </div>
              <div className="pl-row">
                <span className="pl-label">Margin:</span>
                <span className={`pl-value ${data.profit >= 0 ? 'profit' : 'loss'}`}>
                  {data.profitMargin}%
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue vs Expense Chart */}
      <Card title="📊 Revenue vs Expenses (Last 12 Months)">
        <div className="comparison-chart">
          {monthlyComparison.map((month, index) => (
            <div key={index} className="comparison-item">
              <div className="comparison-bars">
                <div className="bar-wrapper">
                  <div
                    className="comparison-bar revenue-bar"
                    style={{ height: `${(month.revenue / maxValue) * 100}%` }}
                    title={`Revenue: ₹${month.revenue.toFixed(2)}`}
                  >
                    {month.revenue > 0 && (
                      <span className="bar-label">₹{(month.revenue / 1000).toFixed(1)}k</span>
                    )}
                  </div>
                </div>
                <div className="bar-wrapper">
                  <div
                    className="comparison-bar expense-bar"
                    style={{ height: `${(month.expenses / maxValue) * 100}%` }}
                    title={`Expenses: ₹${month.expenses.toFixed(2)}`}
                  >
                    {month.expenses > 0 && (
                      <span className="bar-label">₹{(month.expenses / 1000).toFixed(1)}k</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="comparison-month">{month.month}</div>
              <div className={`comparison-profit ${month.profit >= 0 ? 'positive' : 'negative'}`}>
                {month.profit >= 0 ? '↑' : '↓'} ₹{Math.abs(month.profit).toFixed(0)}
              </div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-box revenue"></span>
            <span>Revenue</span>
          </div>
          <div className="legend-item">
            <span className="legend-box expense"></span>
            <span>Expenses</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfitLoss;
