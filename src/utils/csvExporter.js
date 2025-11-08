const exportToCSV = (data, filename) => {
  if (!Array.isArray(data) || !data.length) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys({ ...data[0] }).filter((key) => key !== 'id');
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (value?.toDate) {
          return value.toDate().toISOString();
        }
        return String(value).replace(/"/g, '""');
      })
      .map((value) => `"${value}"`)
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportToCSV;
