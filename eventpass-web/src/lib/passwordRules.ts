export type PasswordRuleId = "length" | "upper" | "lower" | "number" | "special" | "noPersonal";

export type PasswordRuleResult = {
  id: PasswordRuleId;
  label: string;
  passed: boolean;
};

const SPECIAL_CHARS_REGEX = /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/;

export type PersonalInfo = {
  name?: string;
  email?: string;
};

function personalTokens({ name, email }: PersonalInfo): string[] {
  const tokens: string[] = [];
  if (name) {
    for (const part of name.split(/\s+/)) {
      if (part.length >= 3) tokens.push(part.toLowerCase());
    }
  }
  if (email) {
    const local = email.split("@")[0];
    if (local && local.length >= 3) tokens.push(local.toLowerCase());
  }
  return tokens;
}

export function checkPasswordRules(password: string, info: PersonalInfo = {}): PasswordRuleResult[] {
  const lower = password.toLowerCase();
  const tokens = personalTokens(info);
  const containsPersonalInfo = tokens.some((t) => t.length > 0 && lower.includes(t));

  return [
    { id: "length", label: "At least 8 characters", passed: password.length >= 8 },
    { id: "upper", label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { id: "lower", label: "One lowercase letter", passed: /[a-z]/.test(password) },
    { id: "number", label: "One number", passed: /[0-9]/.test(password) },
    { id: "special", label: "One special character", passed: SPECIAL_CHARS_REGEX.test(password) },
    {
      id: "noPersonal",
      label: "Doesn't contain your name or email",
      passed: password.length === 0 ? true : !containsPersonalInfo,
    },
  ];
}

export function isPasswordValid(password: string, info: PersonalInfo = {}): boolean {
  return checkPasswordRules(password, info).every((r) => r.passed);
}

export function missingRulesSummary(password: string, info: PersonalInfo = {}): string {
  const failed = checkPasswordRules(password, info).filter((r) => !r.passed);
  if (failed.length === 0) return "";
  return failed.map((r) => r.label.replace(/^One /, "").replace(/^At least /, "")).join(", ");
}
