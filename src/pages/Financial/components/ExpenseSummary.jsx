import React, { useMemo } from 'react';
import { useFinancialStore } from '../../../store';
import Card from '../../../components/ui/Card';
import './ExpenseSummary.css';

const ExpenseSummary = () => {
  const { expenses } = useFinancialStore();

  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const calculateTotal = (startDate, endDate = new Date()) => {
    return expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const totals = {
    today: calculateTotal(startOfToday),
    week: calculateTotal(startOfWeek),
    month: calculateTotal(startOfMonth),
    year: calculateTotal(startOfYear),
  };

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    expenses.forEach(expense => {
      if (breakdown[expense.category]) {
        breakdown[expense.category] += expense.amount;
      } else {
        breakdown[expense.category] = expense.amount;
      }
    });

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Monthly trend (last 12 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      }).reduce((sum, e) => sum + e.amount, 0);

      months.push({
        month: `${monthName} ${year}`,
        amount: monthExpenses,
      });
    }
    
    return months;
  }, [expenses]);

  const maxMonthlyExpense = Math.max(...monthlyTrend.map(m => m.amount), 1);

  const colors = [
    '#2e7d32', '#1976d2', '#f57c00', '#c62828', '#7b1fa2',
    '#00796b', '#0288d1', '#fbc02d', '#d32f2f', '#512da8'
  ];

  return (
    <div className="expense-summary">
      {/* Summary Cards */}
      <div className="summary-cards">
        <Card>
          <div className="summary-card today">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Today</h3>
              <p className="amount">₹{totals.today.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="summary-card week">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>This Week</h3>
              <p className="amount">₹{totals.week.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="summary-card month">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>This Month</h3>
              <p className="amount">₹{totals.month.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="summary-card year">
            <div className="card-icon">🎯</div>
            <div className="card-content">
              <h3>This Year</h3>
              <p className="amount">₹{totals.year.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Category Pie Chart */}
        <Card title="📊 Expense Breakdown by Category">
          {categoryBreakdown.length === 0 ? (
            <div className="no-data">No expense data available</div>
          ) : (
            <div className="pie-chart-container">
              <div className="pie-chart">
                {categoryBreakdown.map((item, index) => {
                  const cumulativePercentage = categoryBreakdown
                    .slice(0, index)
                    .reduce((sum, i) => sum + parseFloat(i.percentage), 0);
                  
                  return (
                    <div
                      key={item.category}
                      className="pie-slice"
                      style={{
                        '--percentage': `${item.percentage}%`,
                        '--offset': `${cumulativePercentage}%`,
                        '--color': colors[index % colors.length],
                      }}
                      title={`${item.category}: ${item.percentage}%`}
                    />
                  );
                })}
              </div>
              
              <div className="pie-legend">
                {categoryBreakdown.map((item, index) => (
                  <div key={item.category} className="legend-item">
                    <span
                      className="legend-color"
                      style={{ background: colors[index % colors.length] }}
                    />
                    <span className="legend-text">
                      {item.category} - {item.percentage}% (₹{item.amount.toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Monthly Trend Bar Chart */}
        <Card title="📈 Monthly Expense Trend (Last 12 Months)">
          {monthlyTrend.length === 0 ? (
            <div className="no-data">No expense data available</div>
          ) : (
            <div className="bar-chart">
              {monthlyTrend.map((month, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        height: `${(month.amount / maxMonthlyExpense) * 100}%`,
                      }}
                      title={`₹${month.amount.toFixed(2)}`}
                    >
                      <span className="bar-value">
                        {month.amount > 0 ? `₹${(month.amount / 1000).toFixed(1)}k` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="bar-label">{month.month}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ExpenseSummary;
