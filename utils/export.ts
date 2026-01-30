import { HistoryData } from '../types';

export function exportToCSV(history: HistoryData): void {
  const headers = 'Time(s),P_Total(a.u.),ATP+NADPH(a.u.),ADP+NADP+(a.u.),C3(a.u.),C5(a.u.),Event\n';
  const rows = history.time
    .map((t, i) => {
      return `${t},${history.pTotal[i].toFixed(3)},${history.energy[i].toFixed(3)},${history.precursor[i].toFixed(3)},${history.c3[i].toFixed(3)},${history.c5[i].toFixed(3)},${history.markers[i] || ''}`;
    })
    .join('\n');

  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `chloroplast_data_${new Date().toLocaleTimeString().replace(/:/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

