import { useState } from 'react';
import { Check, Flame, Rocket, RotateCcw, Sparkles, Star } from 'lucide-react';

const quests = [
  { id: 'star', title: 'Find the star', detail: 'Start your first quest', xp: 100, Icon: Star },
  { id: 'streak', title: 'Try a streak', detail: 'Earn a daily bonus', xp: 250, Icon: Flame },
  { id: 'reward', title: 'Collect a reward', detail: 'Claim your demo reward', xp: 400, Icon: Sparkles }
] as const;

type QuestId = typeof quests[number]['id'];

const initialXp = 2450;
const targetXp = initialXp + quests.reduce((total, quest) => total + quest.xp, 0);
const formatXp = new Intl.NumberFormat('en-US');

export default function LandingDemo() {
  const [completed, setCompleted] = useState<QuestId[]>([]);
  const [didReset, setDidReset] = useState(false);
  const xp = quests.reduce((total, quest) => completed.includes(quest.id) ? total + quest.xp : total, initialXp);
  const finished = completed.length === quests.length;

  function completeQuest(id: QuestId) {
    setDidReset(false);
    setCompleted(previous => previous.includes(id) ? previous : [...previous, id]);
  }

  function resetDemo() {
    if (completed.length === 0) return;
    setCompleted([]);
    setDidReset(true);
  }

  return (
    <section id="live-demo" className="ql-demo" aria-labelledby="landing-demo-title" tabIndex={-1}>
      <div className="ql-demo-header">
        <div className="ql-demo-heading">
          <Rocket aria-hidden="true" />
          <h2 id="landing-demo-title">Quests</h2>
        </div>
        <button
          type="button"
          className="ql-demo-reset"
          aria-label="Reset demo"
          aria-disabled={completed.length === 0}
          onClick={resetDemo}
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="ql-demo-profile">
        <img src="/landing/mascot-mark.webp" alt="" width={42} height={42} />
        <div className="ql-demo-level">
          <div className="ql-demo-totals">
            <span>{finished ? 'Level 5 unlocked' : 'Level 4'}</span>
            <strong>{formatXp.format(xp)} XP</strong>
          </div>
          <div className="ql-demo-meter">
            <progress value={xp} max={targetXp} aria-label="Demo XP progress" />
            <span style={{ transform: `scaleX(${xp / targetXp})` }} aria-hidden="true" />
          </div>
        </div>
      </div>
      <ul className="ql-demo-quests">
        {quests.map(({ id, title, detail, xp, Icon }) => {
          const done = completed.includes(id);
          return (
            <li key={id}>
              <button type="button" className={`ql-demo-quest ql-demo-quest--${id}`} aria-disabled={done} onClick={() => completeQuest(id)}>
                <span className="ql-demo-quest-icon">{done ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
                <span className="ql-demo-quest-text">
                  <strong>{title}</strong>
                  <small>{done ? 'Completed' : detail}</small>
                </span>
                <span className="ql-demo-quest-xp">{done ? 'Earned ' : '+'}{xp} XP</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="ql-demo-caption">Interactive demo <span aria-hidden="true">·</span> No wallet needed</p>
      <p className="ql-landing-sr" role="status">
        {didReset ? 'Demo reset. 2,450 sample XP.' : completed.length > 0
          ? `${formatXp.format(xp)} sample XP. ${finished ? 'All quests complete. Level 5 reached.' : `${completed.length} of ${quests.length} quests complete.`}`
          : ''}
      </p>
    </section>
  );
}
