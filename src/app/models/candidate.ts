export type CandidateStatus = 'Applied' | 'Interview' | 'Hired' | 'Rejected';
export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  appliedForDepartmentId: number; // relation -> Department
  status: CandidateStatus;
}
