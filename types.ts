import React from 'react';

export interface Demand {
  id: string;
  title: string;
  category: string;
  designer: {
    name: string;
    avatar: string;
  };
  status: 'In Progress' | 'Completed' | 'Review' | 'Late' | 'To Do';
  requestDate: string;
  deadline: string;
  type: string;
  origin: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}