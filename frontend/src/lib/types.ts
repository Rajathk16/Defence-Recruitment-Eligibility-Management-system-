// TypeScript Definitions matching the DREMS PostgreSQL Schema

export type BranchCode = 'ARMY' | 'NAVY' | 'AIR_FORCE' | 'COAST_GUARD';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MaritalStatus = 'UNMARRIED' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type ApplicationStatus = 
  | 'SUBMITTED' 
  | 'ELIGIBLE' 
  | 'REJECTED' 
  | 'EXAM_SCHEDULED' 
  | 'WRITTEN_QUALIFIED' 
  | 'PFT_QUALIFIED' 
  | 'MEDICAL_FIT' 
  | 'RECOMMENDED' 
  | 'MERIT_LISTED';

export type StageName = 'WRITTEN_EXAM' | 'PHYSICAL_TEST' | 'MEDICAL_EXAM' | 'INTERVIEW_SSB';
export type StageStatus = 'PENDING' | 'SCHEDULED' | 'CLEARED' | 'FAILED' | 'ABSENT';
export type MedicalStatus = 'FIT' | 'TEMPORARILY_UNFIT' | 'PERMANENTLY_UNFIT' | 'PENDING';

export interface DefenceBranch {
  id: string;
  code: BranchCode;
  name: string;
  motto: string;
  headquarters: string;
  insignia_icon: string;
}

export interface EligibilityRules {
  id: string;
  notification_id: string;
  min_age_years: number;
  max_age_years: number;
  allowed_gender: 'ALL' | 'MALE_ONLY' | 'FEMALE_ONLY';
  allowed_marital_status: string;
  min_height_male_cm: number;
  min_height_female_cm: number;
  min_chest_expansion_cm: number;
  min_qualification_level: string;
  min_aggregate_percentage: number;
  min_pcm_percentage: number;
  color_blindness_allowed: boolean;
  requires_pcm: boolean;
}

export interface RecruitmentNotification {
  id: string;
  notification_number: string;
  branch_id: string;
  branch?: DefenceBranch;
  title: string;
  entry_type: string;
  total_vacancies: number;
  cutoff_date: string;
  application_start_date: string;
  application_end_date: string;
  exam_date?: string;
  is_active: boolean;
  description: string;
  rules?: EligibilityRules;
}

export interface CandidateProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  dob: string;
  gender: Gender;
  marital_status: MaritalStatus;
  nationality: string;
  domicile_state: string;
  aadhar_number?: string;
  role: 'CANDIDATE' | 'OFFICER' | 'ADMIN';
  height_cm: number;
  weight_kg: number;
  chest_normal_cm?: number;
  chest_expanded_cm?: number;
  eye_vision_left?: string;
  eye_vision_right?: string;
  color_blindness?: boolean;
  qualification_level: string;
  stream_specialization: string;
  aggregate_percentage: number;
  pcm_percentage?: number;
}

export interface Application {
  id: string;
  application_number: string;
  candidate_id: string;
  notification_id: string;
  status: ApplicationStatus;
  is_eligible: boolean;
  eligibility_remarks: string;
  applied_at: string;
  candidate?: CandidateProfile;
  notification?: RecruitmentNotification;
}

export interface SelectionStage {
  id: string;
  application_id: string;
  stage_name: StageName;
  stage_order: number;
  status: StageStatus;
  scheduled_date?: string;
  venue_details?: string;
  completed_at?: string;
}

export interface TestScore {
  id: string;
  application_id: string;
  written_marks: number;
  written_max_marks: number;
  pft_run_time_seconds?: number;
  pft_pushups: number;
  pft_situps: number;
  pft_score: number;
  interview_score: number;
  interview_max_marks: number;
  evaluator_remarks?: string;
}

export interface MedicalExam {
  id: string;
  application_id: string;
  medical_board_location: string;
  exam_date: string;
  status: MedicalStatus;
  blood_group?: string;
  blood_pressure?: string;
  dental_points?: number;
  visual_standard_passed: boolean;
  findings_notes?: string;
  medical_officer_name?: string;
}

export interface MeritListItem {
  rank_order: number;
  candidate_name: string;
  application_number: string;
  composite_score: number;
  is_selected: boolean;
}
