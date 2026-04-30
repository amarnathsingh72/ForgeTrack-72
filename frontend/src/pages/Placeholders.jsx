import React from 'react';

const createPlaceholder = (name) => () => (
  <div className="p-8">
    <h1 className="text-display-md">{name}</h1>
    <p className="text-body text-fg-secondary mt-4">Under construction.</p>
  </div>
);

export const Dashboard = createPlaceholder('Compliance Dashboard');
export const Policies = createPlaceholder('Policy Library');
export const Events = createPlaceholder('Event Log Explorer');
export const Gaps = createPlaceholder('Gap Queue');
export const Remediation = createPlaceholder('Remediation Task Board');
export const Export = createPlaceholder('Auditor Export');
export const Connections = createPlaceholder('Source Connections');
export const Tasks = createPlaceholder('My Remediation Tasks');
export const AuditorPortal = createPlaceholder('Auditor Portal');
