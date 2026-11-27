import React from 'react';

/**
 * Compact goal-scorer list used on match cards and the match-details hero.
 *
 * Reads the `goalEvents` that the backend stores on each fixture (parsed from
 * FootballData events). The backend already assigns every event to the side
 * that benefits from it, so own goals appear under the team that was credited.
 */

const UNKNOWN_NAMES = new Set(['', 'unknown player', 'player', 'unknown']);

function isPenalty(event) {
  return String(event?.detail || '').toLowerCase().includes('penalty');
}

function isOwnGoal(event) {
  return (
    event?.isOwnGoal === true ||
    String(event?.detail || '').toLowerCase().includes('own goal')
  );
}

function minuteLabel(event) {
  if (event?.displayMinute) return event.displayMinute;
  if (event?.minute === null || event?.minute === undefined) return '';
  return event.extraMinute
    ? `${event.minute}+${event.extraMinute}'`
    : `${event.minute}'`;
}

function sortValue(event) {
  return (Number(event?.minute) || 0) * 100 + (Number(event?.extraMinute) || 0);
}

/**
 * Groups one side's goals by scorer so a brace reads "Saka 23' 56'".
 * Order follows each scorer's first goal.
 */
export function groupScorers(events, side) {
  const groups = [];
  const byKey = new Map();

  [...(events || [])]
    .filter((event) => String(event?.teamSide || '').toLowerCase() === side)
    .sort((a, b) => sortValue(a) - sortValue(b))
    .forEach((event) => {
      // `knownName` ("Bukayo Saka") is the fan-facing name; older stored events
      // only have the provider's full legal name in `playerName`.
      const rawName = String(event?.knownName || event?.playerName || '').trim();
      const known = !UNKNOWN_NAMES.has(rawName.toLowerCase());
      const name = known ? rawName : 'Scorer unavailable';
      const own = isOwnGoal(event);
      const key = `${event?.playerId ?? name}|${own}`;

      if (!byKey.has(key)) {
        const group = { key, name, own, goals: [] };
        byKey.set(key, group);
        groups.push(group);
      }

      byKey.get(key).goals.push({
        minute: minuteLabel(event),
        penalty: isPenalty(event),
      });
    });

  return groups;
}

function ScorerLine({ group, align, large }) {
  const isRight = align === 'right';

  return (
    <li
      className={`flex items-start gap-1.5 ${
        isRight ? 'flex-row-reverse text-right' : 'text-left'
      }`}
    >
      <span
        className={`shrink-0 opacity-90 ${
          large ? 'text-sm leading-5' : 'mt-px text-[11px] leading-4'
        }`}
        role="img"
        aria-label="goal"
      >
        ⚽
      </span>

      <span
        className={`min-w-0 text-slate-200 [overflow-wrap:anywhere] [text-wrap:balance] ${
          large ? 'text-sm leading-5' : 'text-xs leading-4'
        }`}
      >
        <span className="font-semibold text-white" title={group.name}>
          {/* Each word is unbreakable so "Lewis-Potter" never splits at the hyphen */}
          {group.name.split(' ').map((word, index, words) => (
            <React.Fragment key={index}>
              <span className="whitespace-nowrap">{word}</span>
              {index < words.length - 1 && ' '}
            </React.Fragment>
          ))}
        </span>
        {group.own && (
          <span className="ml-1 font-bold text-pl-pinkLight">(OG)</span>
        )}{' '}
        <span className="whitespace-nowrap text-pl-muted">
          {group.goals
            .map((goal) => `${goal.minute}${goal.penalty ? ' pen' : ''}`.trim())
            .filter(Boolean)
            .join(', ')}
        </span>
      </span>
    </li>
  );
}

export default function GoalScorers({
  events = [],
  homeScore = null,
  awayScore = null,
  completed = false,
  large = false,
  className = '',
}) {
  const home = groupScorers(events, 'home');
  const away = groupScorers(events, 'away');

  const count = (side) =>
    (events || []).filter(
      (event) => String(event?.teamSide || '').toLowerCase() === side
    ).length;

  // The data provider occasionally lists fewer goal events than the final
  // score. For finished matches say so rather than implying the list is
  // complete. (Live matches lag by up to the 2-minute monitor, so no note.)
  const missingHome =
    !completed || homeScore === null || homeScore === undefined
      ? 0
      : Math.max(0, Number(homeScore) - count('home'));
  const missingAway =
    !completed || awayScore === null || awayScore === undefined
      ? 0
      : Math.max(0, Number(awayScore) - count('away'));
  const missing = missingHome + missingAway;

  if (home.length === 0 && away.length === 0 && missing === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6">
        <ul className="space-y-1">
          {home.map((group) => (
            <ScorerLine key={group.key} group={group} align="right" large={large} />
          ))}
        </ul>

        <ul className="space-y-1">
          {away.map((group) => (
            <ScorerLine key={group.key} group={group} align="left" large={large} />
          ))}
        </ul>
      </div>

      {missing > 0 && (
        <p className="mt-2 text-center text-[10px] text-pl-muted">
          {missing === 1
            ? '1 goal not itemised by the data provider'
            : `${missing} goals not itemised by the data provider`}
        </p>
      )}
    </div>
  );
}
