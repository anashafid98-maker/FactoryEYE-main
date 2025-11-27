// Worker simplifié et robuste
const filterData = (data, range) => {
  return data.filter(item => {
    try {
      const timestamp = new Date(item.timestamp).getTime();
      return timestamp >= range.start.getTime() && 
             timestamp <= range.end.getTime();
    } catch (e) {
      console.error('Error processing item:', e);
      return false;
    }
  });
};

self.onmessage = function(e) {
  const { data, range } = e.data;
  
  if (!data || !range) {
    self.postMessage({ error: 'Invalid data or range provided' });
    return;
  }

  try {
    const result = filterData(data, range);
    self.postMessage({ 
      success: true,
      data: result,
      metadata: {
        originalCount: data.length,
        filteredCount: result.length
      }
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};