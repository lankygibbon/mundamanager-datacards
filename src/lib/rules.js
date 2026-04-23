import RULES from './rules.json'

export { RULES }

export function normaliseRuleName(name) {
  const patterns = [
    [/^(Group Activation)\s*\(\d+\)$/i, "$1 (X)"],
    [/^(Rapid Fire)\s*\(\d+\)$/i, "$1 (X)"],
    [/^(Gang Fighter)\s*\(\w+\)$/i, "$1 (X)"],
    [/^(Promotion)\s*\(.+\)$/i, "$1 (X)"],
    [/^Blast\s*\(.+\)$/i, 'Blast (3"/5"/*)'],
    [/^(Devout Masses)\s*\(.+\)$/i, "$1 (X)"],
    [/^(Tools of the Trade)\s*\(.+\)$/i, "$1"],
  ]
  for (const [pat, repl] of patterns) {
    if (pat.test(name)) return name.replace(pat, repl)
  }
  return name
}

export function getRuleDesc(name) {
  const norm = normaliseRuleName(name)
  return RULES[norm] || RULES[name] || null
}
