import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };
  return (
    <button className="btn btn-secondary" onClick={handlePrint} style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Printer size={16} /> Print Summary
    </button>
  );
}
