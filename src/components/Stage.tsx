import React from 'react';

/**
 * The night stage behind the app, as in Deco Launcher and Worldly: two washes of the amber light
 * drifting slowly, fog banks passing through, a row of small lamps far overhead running a slow
 * chase, and a fine grain. Purely decorative, and still for people who ask for less motion.
 */
export const Stage: React.FC = () => (
  <div className="sab-stage" aria-hidden="true">
    <div className="wash key" />
    <div className="wash low" />
    <div className="fog one" />
    <div className="fog two" />
    <div className="sab-rig">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${(i / 9) * 7}s` }} />
      ))}
    </div>
    <div className="sab-grain" />
  </div>
);
