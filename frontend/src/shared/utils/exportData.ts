export const exportToCSV = (data: any[], filename = 'export.csv') => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: any[], filename = 'export.xlsx') => {
  exportToCSV(data, filename.replace(/\.xlsx$/, '.csv'));
};

export const exportToPDF = (_data: any[], _filename = 'export.pdf') => {
  window.print();
};
