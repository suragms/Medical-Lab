import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AddExpense from './components/AddExpense';
import ExpenseList from './components/ExpenseList';
import ExpenseSummary from './components/ExpenseSummary';
import ProfitLoss from './components/ProfitLoss';
import PricingManager from './components/PricingManager';
import './ExpenseManagement.css';

const ExpenseManagement = () => {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: '📊 Expense Summary', icon: '📊' },
    { id: 'add', label: '➕ Add Expense', icon: '➕' },
    { id: 'list', label: '📋 View All Expenses', icon: '📋' },
    { id: 'profitloss', label: '💰 Profit & Loss', icon: '💰' },
    { id: 'pricing', label: '💵 Pricing Manager', icon: '💵' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return <ExpenseSummary />;
      case 'add':
        return <AddExpense />;
      case 'list':
        return <ExpenseList />;
      case 'profitloss':
        return <ProfitLoss />;
      case 'pricing':
        return <PricingManager />;
      default:
        return <ExpenseSummary />;
    }
  };

  return (
    <div className="expense-management">
      <div className="expense-header">
        <h1>💼 Expense & Financial Management</h1>
        <p className="expense-subtitle">Track expenses, revenue, and profitability</p>
      </div>

      <div className="expense-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="expense-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExpenseManagement;
