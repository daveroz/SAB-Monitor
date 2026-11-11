import React from 'react';

/**
 * The night stage behind the app, as in Deco Launcher and Worldly: two washes of the amber light
 * drifting slowly, fog banks passing through, and a fine grain. The lamps are the light show in the
 * menu on top. Purely decorative, and still for people who ask for less motion.
 */
export const Stage: React.FC = () => (
  <div className="sab-stage" aria-hidden="true">
    <div className="wash key" />
    <div className="wash low" />
    <div className="fog one" />
    <div className="fog two" />
    <div className="sab-grain" />
  </div>
);
