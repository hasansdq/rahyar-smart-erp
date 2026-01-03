import { UserRole } from '../types';

export type PageId = 'dashboard' | 'projects' | 'finance' | 'team' | 'chat' | 'settings' | 'business-plan';

export const PERMISSIONS: Record<PageId, UserRole[]> = {
  'dashboard': [UserRole.MANAGER, UserRole.ADMIN, UserRole.EMPLOYEE],
  'projects': [UserRole.MANAGER, UserRole.ADMIN, UserRole.EMPLOYEE],
  'finance': [UserRole.MANAGER, UserRole.ADMIN],
  'team': [UserRole.MANAGER, UserRole.ADMIN],
  'chat': [UserRole.MANAGER, UserRole.ADMIN, UserRole.EMPLOYEE],
  'business-plan': [UserRole.MANAGER],
  'settings': [UserRole.MANAGER, UserRole.ADMIN, UserRole.EMPLOYEE],
};

export const canAccess = (role: UserRole, page: PageId): boolean => {
  const allowedRoles = PERMISSIONS[page];
  return allowedRoles ? allowedRoles.includes(role) : false;
};

export const getAccessMessage = (page: PageId): string => {
   switch(page) {
       case 'finance': return 'دسترسی به اطلاعات مالی محدود به مدیران و ادمین‌ها است.';
       case 'team': return 'مدیریت پرسنل فقط برای مدیران مجاز است.';
       case 'business-plan': return 'بیزینس پلن محرمانه و فقط مخصوص مدیرعامل است.';
       default: return 'شما مجوز دسترسی به این بخش را ندارید.';
   }
};