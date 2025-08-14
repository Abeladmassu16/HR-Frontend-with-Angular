export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number;   // relation -> Department
  hireDate: string;       // ISO string
  salary: number;
}
