// src/app/core/models.ts
export interface Department { id?: number; name: string; }
export interface Employee { id?: number; fullName: string; salary: number; department: Department; }
