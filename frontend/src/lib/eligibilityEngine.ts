// Client-Side mirror of PostgreSQL Stored Function: fn_evaluate_eligibility
import { CandidateProfile, RecruitmentNotification } from './types';

export interface EvaluationResult {
  is_eligible: boolean;
  calculated_age: number;
  checks: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
  summaryRemarks: string;
}

export function evaluateEligibility(
  candidate: CandidateProfile,
  notification: RecruitmentNotification
): EvaluationResult {
  const rules = notification.rules;
  if (!rules) {
    return {
      is_eligible: false,
      calculated_age: 0,
      checks: [{ label: 'Rules Configuration', passed: false, detail: 'No rules found' }],
      summaryRemarks: 'Eligibility rules are not configured.',
    };
  }

  const checks: EvaluationResult['checks'] = [];
  let isEligible = true;

  // 1. Age Calculation as of Cutoff Date
  const dobDate = new Date(candidate.dob);
  const cutoffDate = new Date(notification.cutoff_date);
  const ageDiffMs = cutoffDate.getTime() - dobDate.getTime();
  const calculatedAge = Math.round((ageDiffMs / (365.25 * 24 * 60 * 60 * 1000)) * 100) / 100;

  const agePassed = calculatedAge >= rules.min_age_years && calculatedAge <= rules.max_age_years;
  if (!agePassed) isEligible = false;
  checks.push({
    label: 'Age Requirement',
    passed: agePassed,
    detail: agePassed
      ? `${calculatedAge} yrs (Eligible: ${rules.min_age_years} - ${rules.max_age_years} yrs)`
      : `${calculatedAge} yrs outside permitted range [${rules.min_age_years} - ${rules.max_age_years} yrs]`,
  });

  // 2. Gender Restriction
  let genderPassed = true;
  if (rules.allowed_gender === 'MALE_ONLY' && candidate.gender !== 'MALE') {
    genderPassed = false;
  } else if (rules.allowed_gender === 'FEMALE_ONLY' && candidate.gender !== 'FEMALE') {
    genderPassed = false;
  }
  if (!genderPassed) isEligible = false;
  checks.push({
    label: 'Gender Eligibility',
    passed: genderPassed,
    detail: genderPassed ? `${candidate.gender} allowed` : `Restricted to ${rules.allowed_gender}`,
  });

  // 3. Marital Status
  let maritalPassed = true;
  if (rules.allowed_marital_status === 'UNMARRIED' && candidate.marital_status !== 'UNMARRIED') {
    maritalPassed = false;
  }
  if (!maritalPassed) isEligible = false;
  checks.push({
    label: 'Marital Status',
    passed: maritalPassed,
    detail: maritalPassed ? candidate.marital_status : 'Must be Unmarried',
  });

  // 4. Height Standard
  const requiredHeight = candidate.gender === 'FEMALE' ? rules.min_height_female_cm : rules.min_height_male_cm;
  const heightPassed = candidate.height_cm >= requiredHeight;
  if (!heightPassed) isEligible = false;
  checks.push({
    label: 'Height Standard',
    passed: heightPassed,
    detail: heightPassed
      ? `${candidate.height_cm} cm (Min: ${requiredHeight} cm)`
      : `${candidate.height_cm} cm is below required ${requiredHeight} cm`,
  });

  // 5. Chest Expansion (for Male candidates)
  if (candidate.gender === 'MALE' && candidate.chest_normal_cm && candidate.chest_expanded_cm) {
    const expansion = candidate.chest_expanded_cm - candidate.chest_normal_cm;
    const chestPassed = expansion >= rules.min_chest_expansion_cm;
    if (!chestPassed) isEligible = false;
    checks.push({
      label: 'Chest Expansion',
      passed: chestPassed,
      detail: chestPassed
        ? `${expansion} cm expansion (Min: ${rules.min_chest_expansion_cm} cm)`
        : `${expansion} cm is below required ${rules.min_chest_expansion_cm} cm`,
    });
  }

  // 6. Educational Marks
  const marksPassed = candidate.aggregate_percentage >= rules.min_aggregate_percentage;
  if (!marksPassed) isEligible = false;
  checks.push({
    label: 'Academic Aggregate',
    passed: marksPassed,
    detail: marksPassed
      ? `${candidate.aggregate_percentage}% (Min: ${rules.min_aggregate_percentage}%)`
      : `${candidate.aggregate_percentage}% is below required ${rules.min_aggregate_percentage}%`,
  });

  // 7. PCM Subject Requirement
  if (rules.requires_pcm) {
    const pcmPassed = (candidate.pcm_percentage || 0) >= rules.min_pcm_percentage;
    if (!pcmPassed) isEligible = false;
    checks.push({
      label: '10+2 PCM Mandate',
      passed: pcmPassed,
      detail: pcmPassed
        ? `PCM: ${candidate.pcm_percentage}% (Min: ${rules.min_pcm_percentage}%)`
        : `PCM requirement of ${rules.min_pcm_percentage}% not satisfied`,
    });
  }

  // 8. Vision / Color Blindness
  if (!rules.color_blindness_allowed && candidate.color_blindness) {
    isEligible = false;
    checks.push({
      label: 'Color Perception',
      passed: false,
      detail: 'Color blindness is disqualifying for this entry',
    });
  }

  const failedChecks = checks.filter(c => !c.passed).map(c => c.detail);
  const summaryRemarks = isEligible
    ? 'All physical, demographic, and educational criteria satisfied.'
    : failedChecks.join('; ');

  return {
    is_eligible: isEligible,
    calculated_age: calculatedAge,
    checks,
    summaryRemarks,
  };
}
