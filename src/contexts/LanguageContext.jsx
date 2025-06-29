import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    createTransaction: 'Create Transaction',
    cashierPanel: 'Cashier Panel',
    reports: 'Reports',
    monthlyReport: 'Monthly Report',
    superFilter: 'Super Filter',
    adminPanel: 'Admin Panel',
    platform: 'Platform',
    
    // Common
    welcome: 'Welcome',
    logout: 'Logout',
    login: 'Login',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    export: 'Export',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading',
    submit: 'Submit',
    close: 'Close',
    
    // Authentication
    signIn: 'Sign in to your account',
    email: 'Email address',
    password: 'Password',
    signingIn: 'Signing in...',
    demoUsers: 'Demo Users',
    demoLoginInfo: 'Demo Login Information:',
    allUsersPassword: 'All users use the password:',
    clickToAutoFill: 'Click any demo user above to auto-fill the form.',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    currentBalance: 'Current Balance',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    pendingApprovals: 'Pending Approvals',
    recentTransactions: 'Recent Transactions',
    noTransactions: 'No transactions yet',
    
    // User Management
    userManagement: 'User Management',
    addNewUser: 'Add New User',
    editUser: 'Edit User',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    role: 'Role',
    addUser: 'Add User',
    updateUser: 'Update User',
    systemUsers: 'System Users',
    admin: 'Admin',
    boardMember: 'Board Member',
    cashier: 'Cashier',
    fullAccess: 'Full Access',
    financialReports: 'Financial Reports',
    approveTransactions: 'Approve Transactions',
    userRolePermissions: 'User Role Permissions',
    
    // Transactions
    type: 'Type',
    category: 'Category',
    item: 'Item',
    amount: 'Amount',
    description: 'Description',
    status: 'Status',
    official: 'Official',
    unofficial: 'Unofficial',
    income: 'Income',
    expense: 'Expense',
    paid: 'Paid',
    pending: 'Pending',
    approved: 'Approved',
    disapproved: 'Disapproved',
    approve: 'Approve',
    disapprove: 'Disapprove',
    
    // Language
    language: 'Language',
    english: 'English',
    greek: 'Greek',
    
    // Validation Messages
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    passwordRequired: 'Password is required',
    nameRequired: 'Name is required',
    emailRequired: 'Email is required',
    roleRequired: 'Role is required',
    
    // Success Messages
    userAdded: 'User added successfully!',
    userUpdated: 'User updated successfully!',
    userDeleted: 'User deleted successfully!',
    loginSuccess: 'Login successful!',
    logoutSuccess: 'Logged out successfully',
  },
  
  el: { // Greek
    // Navigation
    dashboard: 'Πίνακας Ελέγχου',
    transactions: 'Συναλλαγές',
    createTransaction: 'Δημιουργία Συναλλαγής',
    cashierPanel: 'Πάνελ Ταμία',
    reports: 'Αναφορές',
    monthlyReport: 'Μηνιαία Αναφορά',
    superFilter: 'Προχωρημένο Φίλτρο',
    adminPanel: 'Πάνελ Διαχειριστή',
    platform: 'Πλατφόρμα',
    
    // Common
    welcome: 'Καλώς ήρθατε',
    logout: 'Αποσύνδεση',
    login: 'Σύνδεση',
    save: 'Αποθήκευση',
    cancel: 'Ακύρωση',
    delete: 'Διαγραφή',
    edit: 'Επεξεργασία',
    add: 'Προσθήκη',
    export: 'Εξαγωγή',
    search: 'Αναζήτηση',
    filter: 'Φίλτρο',
    loading: 'Φόρτωση',
    submit: 'Υποβολή',
    close: 'Κλείσιμο',
    
    // Authentication
    signIn: 'Συνδεθείτε στον λογαριασμό σας',
    email: 'Διεύθυνση Email',
    password: 'Κωδικός Πρόσβασης',
    signingIn: 'Σύνδεση...',
    demoUsers: 'Δοκιμαστικοί Χρήστες',
    demoLoginInfo: 'Πληροφορίες Δοκιμαστικής Σύνδεσης:',
    allUsersPassword: 'Όλοι οι χρήστες χρησιμοποιούν τον κωδικό:',
    clickToAutoFill: 'Κάντε κλικ σε οποιονδήποτε δοκιμαστικό χρήστη για αυτόματη συμπλήρωση.',
    
    // Dashboard
    welcomeBack: 'Καλώς ήρθατε πίσω',
    currentBalance: 'Τρέχον Υπόλοιπο',
    totalIncome: 'Συνολικά Έσοδα',
    totalExpenses: 'Συνολικά Έξοδα',
    pendingApprovals: 'Εκκρεμείς Εγκρίσεις',
    recentTransactions: 'Πρόσφατες Συναλλαγές',
    noTransactions: 'Δεν υπάρχουν συναλλαγές ακόμα',
    
    // User Management
    userManagement: 'Διαχείριση Χρηστών',
    addNewUser: 'Προσθήκη Νέου Χρήστη',
    editUser: 'Επεξεργασία Χρήστη',
    fullName: 'Πλήρες Όνομα',
    emailAddress: 'Διεύθυνση Email',
    role: 'Ρόλος',
    addUser: 'Προσθήκη Χρήστη',
    updateUser: 'Ενημέρωση Χρήστη',
    systemUsers: 'Χρήστες Συστήματος',
    admin: 'Διαχειριστής',
    boardMember: 'Μέλος Διοίκησης',
    cashier: 'Ταμίας',
    fullAccess: 'Πλήρης Πρόσβαση',
    financialReports: 'Οικονομικές Αναφορές',
    approveTransactions: 'Έγκριση Συναλλαγών',
    userRolePermissions: 'Δικαιώματα Ρόλων Χρηστών',
    
    // Transactions
    type: 'Τύπος',
    category: 'Κατηγορία',
    item: 'Αντικείμενο',
    amount: 'Ποσό',
    description: 'Περιγραφή',
    status: 'Κατάσταση',
    official: 'Επίσημο',
    unofficial: 'Ανεπίσημο',
    income: 'Έσοδο',
    expense: 'Έξοδο',
    paid: 'Πληρωμένο',
    pending: 'Εκκρεμές',
    approved: 'Εγκεκριμένο',
    disapproved: 'Απορριφθέν',
    approve: 'Έγκριση',
    disapprove: 'Απόρριψη',
    
    // Language
    language: 'Γλώσσα',
    english: 'Αγγλικά',
    greek: 'Ελληνικά',
    
    // Validation Messages
    required: 'Αυτό το πεδίο είναι υποχρεωτικό',
    invalidEmail: 'Μη έγκυρη διεύθυνση email',
    passwordRequired: 'Ο κωδικός πρόσβασης είναι υποχρεωτικός',
    nameRequired: 'Το όνομα είναι υποχρεωτικό',
    emailRequired: 'Το email είναι υποχρεωτικό',
    roleRequired: 'Ο ρόλος είναι υποχρεωτικός',
    
    // Success Messages
    userAdded: 'Ο χρήστης προστέθηκε επιτυχώς!',
    userUpdated: 'Ο χρήστης ενημερώθηκε επιτυχώς!',
    userDeleted: 'Ο χρήστης διαγράφηκε επιτυχώς!',
    loginSuccess: 'Επιτυχής σύνδεση!',
    logoutSuccess: 'Αποσυνδεθήκατε επιτυχώς',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('el'); // Default to Greek
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved language preference or default to Greek
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'el')) {
      setLanguage(savedLanguage);
    }
    setIsLoading(false);
  }, []);

  const changeLanguage = (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'el') {
      setLanguage(newLanguage);
      localStorage.setItem('selectedLanguage', newLanguage);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};