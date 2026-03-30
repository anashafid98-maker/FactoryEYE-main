export const generateEquipmentDiagram = (equipmentType: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 600, 400);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let i = 0; i < 600; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 400);
    ctx.stroke();
  }
  for (let i = 0; i < 400; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(600, i);
    ctx.stroke();
  }

  const type = equipmentType.toLowerCase();

  if (type.includes('compressor') || type.includes('compresseur')) {
    drawCompressor(ctx);
  } else if (type.includes('motor') || type.includes('moteur')) {
    drawMotor(ctx);
  } else if (type.includes('pump') || type.includes('pompe')) {
    drawPump(ctx);
  } else if (type.includes('tank') || type.includes('réservoir')) {
    drawTank(ctx);
  } else if (type.includes('valve') || type.includes('vanne')) {
    drawValve(ctx);
  } else if (type.includes('turbine')) {
    drawTurbine(ctx);
  } else if (type.includes('heat exchanger') || type.includes('échangeur')) {
    drawHeatExchanger(ctx);
  } else if (type.includes('fan') || type.includes('ventilateur')) {
    drawFan(ctx);
  } else {
    drawGenericEquipment(ctx);
  }

  return canvas.toDataURL('image/png');
};

const drawCompressor = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#1e40af';
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(300, 200, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(300, 200, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(220, 200);
  ctx.lineTo(180, 200);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(380, 200);
  ctx.lineTo(420, 200);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.fillRect(170, 190, 20, 20);
  ctx.fillRect(410, 190, 20, 20);

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x = 300 + Math.cos(angle) * 50;
    const y = 200 + Math.sin(angle) * 50;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('COMPRESSOR', 300, 320);
};

const drawMotor = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 3;

  ctx.fillRect(200, 120, 200, 160);
  ctx.strokeRect(200, 120, 200, 160);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(220, 140, 160, 120);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(380, 180, 60, 40);
  ctx.fillRect(160, 180, 60, 40);

  for (let i = 0; i < 4; i++) {
    const x = 240 + i * 40;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 160, 20, 80);
  }

  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('MOTOR', 300, 320);
};

const drawPump = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#059669';
  ctx.strokeStyle = '#065f46';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.ellipse(300, 200, 100, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.ellipse(300, 200, 70, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#065f46';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.lineTo(160, 200);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(400, 200);
  ctx.lineTo(440, 200);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.fillRect(150, 185, 20, 30);
  ctx.fillRect(430, 185, 20, 30);

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, 200);
    ctx.lineTo(300 + Math.cos(angle) * 60, 200 + Math.sin(angle) * 40);
    ctx.stroke();
  }

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PUMP', 300, 320);
};

const drawTank = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;

  ctx.fillRect(220, 100, 160, 200);
  ctx.strokeRect(220, 100, 160, 200);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(230, 110, 140, 180);

  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(230, 200, 140, 90);

  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(230, 200 + i * 20);
    ctx.lineTo(370, 200 + i * 20);
    ctx.stroke();
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(290, 80, 20, 30);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TANK', 300, 330);
};

const drawValve = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(300, 120);
  ctx.lineTo(380, 200);
  ctx.lineTo(300, 280);
  ctx.lineTo(220, 200);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(220, 200);
  ctx.lineTo(160, 200);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(380, 200);
  ctx.lineTo(440, 200);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(300, 200, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(300, 160);
  ctx.lineTo(300, 110);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(300, 100, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('VALVE', 300, 330);
};

const drawTurbine = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#8b5cf6';
  ctx.strokeStyle = '#6d28d9';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(300, 200, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.beginPath();
  ctx.arc(300, 200, 30, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.fillStyle = '#c4b5fd';
    ctx.strokeStyle = '#6d28d9';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(300, 200);
    const x1 = 300 + Math.cos(angle) * 30;
    const y1 = 200 + Math.sin(angle) * 30;
    const x2 = 300 + Math.cos(angle + 0.3) * 85;
    const y2 = 200 + Math.sin(angle + 0.3) * 85;
    const x3 = 300 + Math.cos(angle - 0.3) * 85;
    const y3 = 200 + Math.sin(angle - 0.3) * 85;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#6d28d9';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TURBINE', 300, 330);
};

const drawHeatExchanger = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;

  ctx.fillRect(200, 130, 200, 140);
  ctx.strokeRect(200, 130, 200, 140);

  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(210 + i * 30, 140);
    ctx.lineTo(210 + i * 30, 260);
    ctx.stroke();
  }

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(200, 160);
  ctx.lineTo(160, 160);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(400, 160);
  ctx.lineTo(440, 160);
  ctx.stroke();

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(200, 240);
  ctx.lineTo(160, 240);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(400, 240);
  ctx.lineTo(440, 240);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('HEAT EXCHANGER', 300, 310);
};

const drawFan = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#0891b2';
  ctx.strokeStyle = '#0e7490';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(300, 200, 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(300, 200, 20, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.fillStyle = '#22d3ee';
    ctx.strokeStyle = '#0e7490';
    ctx.lineWidth = 2;

    ctx.save();
    ctx.translate(300, 200);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.quadraticCurveTo(40, -40, 70, -50);
    ctx.quadraticCurveTo(40, -20, 20, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.fillStyle = '#0e7490';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FAN', 300, 330);
};

const drawGenericEquipment = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;

  ctx.fillRect(220, 130, 160, 140);
  ctx.strokeRect(220, 130, 160, 140);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(235, 145, 130, 110);

  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.fillRect(245 + j * 40, 155 + i * 35, 30, 25);
    }
  }

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('EQUIPMENT', 300, 310);
};
