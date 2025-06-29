import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Equipment', type: 'expense' },
    { id: 2, name: 'Travel', type: 'expense' },
    { id: 3, name: 'Facilities', type: 'expense' },
    { id: 4, name: 'Sponsorship', type: 'income' },
    { id: 5, name: 'Ticket Sales', type: 'income' },
    { id: 6, name: 'Merchandise', type: 'income' }
  ]);
  const [items, setItems] = useState([
    { id: 1, categoryId: 1, name: 'Footballs' },
    { id: 2, categoryId: 1, name: 'Training Cones' },
    { id: 3, categoryId: 2, name: 'Bus Rental' },
    { id: 4, categoryId: 2, name: 'Hotel' },
    { id: 5, categoryId: 3, name: 'Field Rental' },
    { id: 6, categoryId: 4, name: 'Main Sponsor' },
    { id: 7, categoryId: 5, name: 'Match Tickets' },
    { id: 8, categoryId: 6, name: 'Jersey Sales' }
  ]);
  const [platformButtons, setPlatformButtons] = useState([
    { id: 1, text: 'Training Attendance', url: 'https://example.com/attendance' },
    { id: 2, text: 'Match Schedule', url: 'https://example.com/schedule' }
  ]);
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', email: 'admin@team.com', role: 'admin' },
    { id: 2, name: 'Board Member', email: 'board@team.com', role: 'board' },
    { id: 3, name: 'Cashier', email: 'cashier@team.com', role: 'cashier' }
  ]);

  useEffect(() => {
    // Load data from localStorage
    const storedTransactions = localStorage.getItem('soccerTeamTransactions');
    const storedCategories = localStorage.getItem('soccerTeamCategories');
    const storedItems = localStorage.getItem('soccerTeamItems');
    const storedButtons = localStorage.getItem('soccerTeamButtons');

    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    if (storedCategories) setCategories(JSON.parse(storedCategories));
    if (storedItems) setItems(JSON.parse(storedItems));
    if (storedButtons) setPlatformButtons(JSON.parse(storedButtons));
  }, []);

  const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      approvalStatus: 'pending'
    };
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveToStorage('soccerTeamTransactions', updatedTransactions);
  };

  const updateTransaction = (id, updates) => {
    const updatedTransactions = transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    setTransactions(updatedTransactions);
    saveToStorage('soccerTeamTransactions', updatedTransactions);
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveToStorage('soccerTeamTransactions', updatedTransactions);
  };

  const addCategory = (category) => {
    const newCategory = { ...category, id: Date.now() };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    saveToStorage('soccerTeamCategories', updatedCategories);
  };

  const addItem = (item) => {
    const newItem = { ...item, id: Date.now() };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveToStorage('soccerTeamItems', updatedItems);
  };

  const addPlatformButton = (button) => {
    const newButton = { ...button, id: Date.now() };
    const updatedButtons = [...platformButtons, newButton];
    setPlatformButtons(updatedButtons);
    saveToStorage('soccerTeamButtons', updatedButtons);
  };

  const deletePlatformButton = (id) => {
    const updatedButtons = platformButtons.filter(b => b.id !== id);
    setPlatformButtons(updatedButtons);
    saveToStorage('soccerTeamButtons', updatedButtons);
  };

  const value = {
    transactions,
    categories,
    items,
    platformButtons,
    users,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    addItem,
    addPlatformButton,
    deletePlatformButton
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};