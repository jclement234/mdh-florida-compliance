export function selectRequirements(records, answers) {
  return records.filter(record => !record.condition_key || answers[record.condition_key] !== 'no');
}

export function reviewGaps(answers) {
  const gaps = ['Confirm the exact city or unincorporated boundary for your business address. This location profile is not an address-level determination.'];
  if (answers.entity_type !== 'sole_proprietor') gaps.push('Entity formation, registration and ongoing filing obligations are not evaluated in this preview.');
  if (answers.has_employees !== 'no') gaps.push('Employee-related requirements are not evaluated in this preview.');
  if (answers.home_based !== 'no') gaps.push('Home occupation, equipment storage and vehicle parking need address-specific review.');
  if (answers.wash_water !== 'no') gaps.push('Wastewater handling and disposal need activity-specific and local review.');
  gaps.push('Professional scope, zoning and other requirements may remain unresolved. These notes are research gaps, not a complete list of obligations.');
  return gaps;
}
