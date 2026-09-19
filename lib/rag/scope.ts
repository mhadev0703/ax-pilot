function hasAny(text: string, pattern: RegExp) {
  return pattern.test(text);
}

// v0.7 intentionally supports only two bounded issue patterns. This gate does
// not diagnose an issue; it prevents a vague request from being forced into a
// retrieved scenario before human triage can establish the missing context.
export function isWithinSupportedInvestigationScope(question: string) {
  const normalized = question.toLowerCase();
  const vdiSystem = hasAny(
    normalized,
    /\bvdi\b|virtual desktop|remote desktop|가상\s*데스크톱/i,
  );
  const passwordChange = hasAny(
    normalized,
    /password|credential|비밀번호|암호/i,
  );
  const groupwareSystem = hasAny(
    normalized,
    /groupware|workspace|team (?:area|space|workspace)|그룹웨어|워크스페이스|팀\s*공간/i,
  );
  const transferContext = hasAny(
    normalized,
    /department|transfer|role|membership|부서|이동|발령|역할|권한/i,
  );

  return (vdiSystem && passwordChange) || (groupwareSystem && transferContext);
}
