const { google } = require('googleapis');

const CALENDAR_ID = '14b75b7ed5bc14409ed4370be8284163994de0e879e9c7322e75231a5a7c56cd@group.calendar.google.com';

// Cores do Google Calendar por ID
// https://developers.google.com/calendar/api/v3/reference/colors
const CORES = {
  confirmada: '2',  // Verde (Sage)
  pendente:   '5',  // Amarelo (Banana)
  cancelada:  '11', // Vermelho (Tomato)
  bloqueio:   '8',  // Grafite (Graphite)
};

function getAuth() {
  const base64      = process.env.GOOGLE_SERVICE_ACCOUNT;
  const jsonStr     = Buffer.from(base64, 'base64').toString('utf8');
  const credentials = JSON.parse(jsonStr);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

function montarEventBody(titulo, descricao, dataEntrada, dataSaida, horaEntrada, horaSaida, status) {
  let startObj, endObj;

  if (horaEntrada && horaSaida) {
    startObj = { dateTime: `${dataEntrada}T${horaEntrada}:00`, timeZone: 'America/Sao_Paulo' };
    endObj   = { dateTime: `${dataSaida}T${horaSaida}:00`,    timeZone: 'America/Sao_Paulo' };
  } else {
    startObj = { date: dataEntrada };
    endObj   = { date: dataSaida   };
  }

  return {
    summary:     titulo    || 'Reserva - Casa do Céu',
    description: descricao || '',
    colorId:     CORES[status] || CORES['pendente'],
    start: startObj,
    end:   endObj,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Body inválido' };
  }

  const {
    acao,
    eventId,
    titulo,
    dataEntrada,
    dataSaida,
    horaEntrada,
    horaSaida,
    descricao,
    status,
  } = body;

  console.log('=== evento-calendario chamado ===');
  console.log('acao:', acao, '| eventId:', eventId, '| status:', status);

  try {
    const auth     = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    // ── EXCLUIR ──
    if (acao === 'excluir') {
      if (!eventId) {
        return { statusCode: 400, body: 'eventId obrigatório para exclusão' };
      }
      await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
      console.log('Evento excluído:', eventId);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (!dataEntrada || !dataSaida) {
      return { statusCode: 400, body: 'Datas obrigatórias' };
    }

    const requestBody = montarEventBody(titulo, descricao, dataEntrada, dataSaida, horaEntrada, horaSaida, status);

    // ── ATUALIZAR ──
    if (acao === 'atualizar' && eventId) {
      const response = await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId,
        requestBody,
      });
      console.log('Evento atualizado:', response.data.id);
      return { statusCode: 200, body: JSON.stringify({ eventId: response.data.id }) };
    }

    // ── CRIAR ──
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody,
    });
    console.log('Evento criado:', response.data.id);
    return { statusCode: 200, body: JSON.stringify({ eventId: response.data.id }) };

  } catch (err) {
    console.error('ERRO:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};