export const fetchZones = async () => {
    const response = await fetch('http://10.190.50.127:8080/api/zones');
    if (!response.ok) throw new Error('Échec du chargement');
    return response.json();
  };
  
  interface ZoneData {
    name: string;
    // Add other properties as needed
  }

  export const createZone = async (zoneData: ZoneData) => {
    const response = await fetch('http://10.190.50.127:8080/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData),
    });
    if (!response.ok) throw new Error('Échec de la création');
    return response.json();
  };
  
  export const deleteEquipment = async (zoneId: number, equipmentName: string) => {
    const response = await fetch(
      `http://10.190.50.127:8080/api/zones/${zoneId}/equipment/${encodeURIComponent(equipmentName)}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Échec de la suppression');
  };