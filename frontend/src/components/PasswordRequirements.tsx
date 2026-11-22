import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

/**
 * Password rules, kept identical to the backend `passwordRules`
 * (express-validator). If the backend rules change, update these too.
 */
const RULES: { key: string; test: (pw: string) => boolean }[] = [
  { key: 'pw_rule_length', test: (pw) => pw.length >= 8 },
  { key: 'pw_rule_lower', test: (pw) => /[a-z]/.test(pw) },
  { key: 'pw_rule_upper', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'pw_rule_number', test: (pw) => /[0-9]/.test(pw) },
  { key: 'pw_rule_special', test: (pw) => /[#?!&@$%^*_\-]/.test(pw) },
];

/** Returns true when the password meets every rule. */
export const isPasswordValid = (pw: string): boolean => RULES.every((r) => r.test(pw));

interface Props {
  password: string;
}

/**
 * Shows the password requirements under the password field.
 * Each rule is ticked as soon as the typed password meets it.
 */
export default function PasswordRequirements({ password }: Props) {
  const { t } = useTranslation();

  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }} aria-live="polite">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <Box
            component="li"
            key={rule.key}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              color: ok ? 'success.main' : 'text.secondary',
            }}
          >
            {ok
              ? <CheckCircleIcon sx={{ fontSize: 16 }} />
              : <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />}
            <Typography variant="caption">{t(rule.key)}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}