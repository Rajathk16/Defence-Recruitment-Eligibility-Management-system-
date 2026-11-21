// System Configuration for DREMS (Defence Recruitment Eligibility Management System)

// Default officer access code for development/evaluation.
// For production deployments, override via OFFICER_ACCESS_CODE environment variable.
export const DEFAULT_OFFICER_CODE = '4827';

export function getOfficerAccessCode(): string {
  return process.env.OFFICER_ACCESS_CODE || DEFAULT_OFFICER_CODE;
}
