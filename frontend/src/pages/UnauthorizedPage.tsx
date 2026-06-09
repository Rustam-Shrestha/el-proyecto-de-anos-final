import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => (
  <div style={{ padding: 24 }}>
    <h1>Unauthorized</h1>
    <p>You do not have permission to view this page.</p>
    <Link to="/">Return home</Link>
  </div>
);

export default UnauthorizedPage;
