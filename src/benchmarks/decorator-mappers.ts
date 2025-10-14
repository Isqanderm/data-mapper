/**
 * Decorator-based mapper classes for benchmarking
 * These classes will be compiled and used in performance comparisons
 */

import {
  MapperDecorator as Mapper,
  Map,
  MapFrom,
  Transform,
  Default,
} from '../decorators';

// ============================================================================
// Simple Mapping Mapper
// ============================================================================

export type SimpleSource = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: string;
};

export type SimpleTarget = {
  userId: number;
  fullName: string;
  contactEmail: string;
  userAge: number;
  active: boolean;
  created: string;
};

@Mapper()
export class SimpleDecoratorMapper {
  @Map('id')
  userId!: number;

  @Transform((src: SimpleSource) => `${src.firstName} ${src.lastName}`)
  fullName!: string;

  @Map('email')
  contactEmail!: string;

  @Map('age')
  userAge!: number;

  @Map('isActive')
  active!: boolean;

  @Map('createdAt')
  created!: string;
}

// ============================================================================
// Complex Transformations Mapper
// ============================================================================

export type ComplexSource = {
  user: {
    id: number;
    profile: {
      firstName: string;
      lastName: string;
      age: number;
    };
  };
  settings: {
    theme: string;
    notifications: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
};

export type ComplexTarget = {
  id: number;
  displayName: string;
  isAdult: boolean;
  preferences: {
    theme: string;
    notificationsEnabled: boolean;
  };
  timestamps: {
    created: Date;
    updated: Date;
  };
};

@Mapper()
export class ComplexDecoratorMapper {
  @Map('user.id')
  id!: number;

  @Transform((src: ComplexSource) => `${src.user.profile.firstName} ${src.user.profile.lastName}`)
  displayName!: string;

  @Transform((src: ComplexSource) => src.user.profile.age >= 18)
  isAdult!: boolean;

  @MapFrom((src: ComplexSource) => ({
    theme: src.settings.theme,
    notificationsEnabled: src.settings.notifications,
  }))
  preferences!: { theme: string; notificationsEnabled: boolean };

  @MapFrom((src: ComplexSource) => ({
    created: new Date(src.metadata.createdAt),
    updated: new Date(src.metadata.updatedAt),
  }))
  timestamps!: { created: Date; updated: Date };
}

// ============================================================================
// Nested Objects Mapper
// ============================================================================

export type NestedSource = {
  company: {
    name: string;
    address: {
      street: string;
      city: string;
      country: string;
    };
  };
  employee: {
    name: string;
    position: string;
    salary: number;
  };
};

export type NestedTarget = {
  companyName: string;
  location: string;
  employeeName: string;
  role: string;
  compensation: number;
};

@Mapper()
export class NestedDecoratorMapper {
  @Map('company.name')
  companyName!: string;

  @Transform((src: NestedSource) => `${src.company.address.city}, ${src.company.address.country}`)
  location!: string;

  @Map('employee.name')
  employeeName!: string;

  @Map('employee.position')
  role!: string;

  @Map('employee.salary')
  compensation!: number;
}

// ============================================================================
// Array Item Mapper
// ============================================================================

export type ArrayItemSource = {
  id: number;
  name: string;
  value: number;
};

export type ArrayItemTarget = {
  itemId: number;
  itemName: string;
  itemValue: number;
};

@Mapper()
export class ArrayItemDecoratorMapper {
  @Map('id')
  itemId!: number;

  @Map('name')
  itemName!: string;

  @Map('value')
  itemValue!: number;
}

// ============================================================================
// Conditional Mapping Mapper
// ============================================================================

export type ConditionalSource = {
  status: 'active' | 'inactive' | 'pending';
  score?: number;
  premium?: boolean;
  lastLogin?: string;
};

export type ConditionalTarget = {
  isActive: boolean;
  userScore: number;
  isPremium: boolean;
  lastAccess: string;
  statusLabel: string;
};

@Mapper()
export class ConditionalDecoratorMapper {
  @Transform((src: ConditionalSource) => src.status === 'active')
  isActive!: boolean;

  @Map('score')
  @Default(0)
  userScore!: number;

  @Map('premium')
  @Default(false)
  isPremium!: boolean;

  @Map('lastLogin')
  @Default('Never')
  lastAccess!: string;

  @Transform((src: ConditionalSource) => {
    switch (src.status) {
      case 'active': return 'Active User';
      case 'inactive': return 'Inactive User';
      case 'pending': return 'Pending Activation';
      default: return 'Unknown';
    }
  })
  statusLabel!: string;
}

