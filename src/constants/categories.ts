import { Category } from '../types';
import { CategoryColors, CategoryIcons } from './theme';

export const CATEGORIES: Category[] = [
  { id: 'shopping', label: 'Shopping', color: CategoryColors.shopping, icon: CategoryIcons.shopping },
  { id: 'work', label: 'Work', color: CategoryColors.work, icon: CategoryIcons.work },
  { id: 'personal', label: 'Personal', color: CategoryColors.personal, icon: CategoryIcons.personal },
  { id: 'health', label: 'Health', color: CategoryColors.health, icon: CategoryIcons.health },
  { id: 'finance', label: 'Finance', color: CategoryColors.finance, icon: CategoryIcons.finance },
  { id: 'social', label: 'Social', color: CategoryColors.social, icon: CategoryIcons.social },
  { id: 'general', label: 'General', color: CategoryColors.general, icon: CategoryIcons.general },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
